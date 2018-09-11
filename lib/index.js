const { fromJS } = require('immutable')

const { BN, ipfsGetData, ipfsCheckMultihash } = require('./helpers')

// Delay in-line of a function
const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

class TCRListings {
  constructor(contractAddresses = [], user) {
    this.user = user
    this.contractAddresses = contractAddresses
    this.createListing = this.createListing.bind(this)
    this.batchCreateListings = this.batchCreateListings.bind(this)
    this.changeMatchListingWithLog = this.changeMatchListingWithLog.bind(this)
    this.changeMatchListingsWithLogs = this.changeMatchListingsWithLogs.bind(this)
    this.replaceDuplicateListings = this.replaceDuplicateListings.bind(this)
    this.findMatchingListing = this.findMatchingListing.bind(this)
    this.listings = []
  }

  // ------------------------------------------------------------------------------
  // Builds an Immutable Map of Listings
  // If listings are provided, they are upgraded here.
  // A Listing w/ matching listingHash will be replaced by a more recent Listing.
  // e.g. Listing applies, gets listed, challenged, loses challenge, applies again.
  // ------------------------------------------------------------------------------

  async getListings(applicationLogs, nonApplicationLogs = [], localListings = {}) {
    const applicationListings = await this.batchCreateListings(applicationLogs, [])
    // Turn Listings into an Immutable Map, replacing older ones w/ newer ones
    const immutableListings = this.replaceDuplicateListings(
      applicationListings,
      localListings
    )
    // Make changes to Listings based on event log data
    this.listings = this.changeMatchListingsWithLogs(
      nonApplicationLogs,
      immutableListings
    )

    return this.listings
  }

  // prettier-ignore
  // Creates a flat listing object from an _Application log and some transaction information
  // returns the built Listing
  async createListing({ logData, txData, eventName }) {
    let { listingHash, listingID, data, appEndDate, applicant } = logData

    // IPFS multihash validation
    if (ipfsCheckMultihash(data)) {
      // CASE: data is an ipfs pointer, content.id is identifier, content.data is metadata
      const ipfsContent = await ipfsGetData(data)
      listingID = ipfsContent.id
      data = ipfsContent.data
    } else if (!listingID && data) {
      // CASE: data is identifier
      listingID = data
    } else if (!listingID) {
      listingID = data
    }

    // Initial proto-structure for each listing entity
    return {
      listingHash,              // On-chain keccak256 listing identifier
      listingID,                // Off-chain string listing identifier
      data,                     // Evm metadata output
      owner: applicant,         // Applicant is the listing's owner
      status: 'applied',        // Can be changed to: whitelisted, challenged, removed
      appEndDate,
      latestEvent: eventName,   // Recent event name
      latestBlockTxn: txData,   // Recent block & tx
    }
  }

  async batchCreateListings(applications, accListings = []) {
    try {
      // Get the first 1 - 4 in the list
      const chunkApplications = applications.slice(0, 4)

      if (applications.length > 0) {
        // Create listings with those 4
        const chunkListings = await Promise.all(
          chunkApplications.map(applicationLog => this.createListing(applicationLog))
        )

        // Delay if there are more than 4 in the original list (ipfs timeout work-around)
        if (applications.length > 4) {
          await wait(900)
          console.log('batching..')
        }

        // Recurse, this time with all BUT the first 4 in the list
        // Concat the listings with the newly created 4 listings
        return this.batchCreateListings(
          applications.slice(4),
          accListings.concat(chunkListings)
        )
      }

      // Return the accumulation of listings
      return accListings
    } catch (error) {
      console.log('Failed to batch-create listings:', error)
    }
  }

  // Returns an accumulation of updated Listings
  changeMatchListingsWithLogs(assortedLogs, listings = fromJS({})) {
    // sift through the new array of logs
    return assortedLogs.reduce((acc, val) => {
      // find a matching listing in the accumulation array
      // match corresponds with the event emission args (listingHash or pollID).
      const match = this.findMatchingListing(val.logData, acc, val.eventName)
      // TODO: break out into it's own validation method. maybe use normalizr
      if (match && match.has('listingHash')) {
        const maybeChanged = this.changeMatchListingWithLog(match, val)
        return acc.set(match.get('listingHash'), fromJS(maybeChanged))
      }
      return acc
    }, fromJS(listings))
  }

  // Returns an updated Listing using an event log
  changeMatchListingWithLog(matchListing, { logData, txData, eventName }) {
    // prettier-ignore
    // Validate: a listing should only be updated by a newer log
    if (BN(txData.blockTimestamp).lt(BN(matchListing.getIn(['latestBlockTxn', 'blockTimestamp'])))) {
      // Incoming log is older than the matching listing's most recent update
      // Invalid update, return matchListing
      return matchListing
    }

    // Set the listing's latest tx info to the incoming one
    // At this point, we've validated it needs to be updated
    const olderMatch = matchListing
      .set('latestBlockTxn', fromJS(txData))
      .set('latestEvent', fromJS(eventName))

    switch (eventName) {
      case '_Challenge':
        return olderMatch.merge({
          status: 'challenged',
          challenger: logData.challenger,
          pollID: BN(logData.challengeID).toString(),
          commitEndDate: BN(logData.commitEndDate).toString(),
          revealEndDate: BN(logData.revealEndDate).toString(),
          votesCommitted: '0',
          votesFor: '0',
          votesAgainst: '0',
          votesTotal: '0',
          userVoteNumTokens: '0',
          userVoteChoice: '',
          tokensToClaim: false,
        })
      case '_ChallengeFailed':
      case '_ApplicationWhitelisted':
        if (olderMatch.get('userVoteChoice') === '1') {
          return olderMatch.merge({
            tokensToClaim: true,
            status: 'whitelisted',
            whitelistBlockTimestamp: BN(txData.blockTimestamp).toString(),
          })
        }
        return olderMatch.merge({
          status: 'whitelisted',
          whitelistBlockTimestamp: BN(txData.blockTimestamp).toString(),
        })
      case '_ApplicationRemoved':
      case '_ListingRemoved':
      case '_ChallengeSucceeded':
        return olderMatch.merge({
          status: 'removed',
          whitelistBlockTimestamp: false,
          removedBlockTimestamp: BN(txData.blockTimestamp).toString(),
        })
      case '_VoteCommitted':
        // prettier-ignore
        // Increment the total votes committed to this listing
        // w/ the numTokens committed during this particular event log
        return olderMatch.set('votesCommitted', 
          BN(olderMatch.get('votesCommitted')).add(BN(logData.numTokens)).toString()
        )
      case '_VoteRevealed':
        if (logData.voter === this.user) {
          return olderMatch.merge({
            votesFor: BN(logData.votesFor).toString(),
            votesAgainst: BN(logData.votesAgainst).toString(),
            userVoteNumTokens: BN(logData.numTokens).toString(),
            userVoteChoice: logData.choice.toString(),
            votesTotal: BN(logData.votesAgainst)
              .add(BN(logData.votesFor))
              .toString(),
          })
        }
        return olderMatch.merge({
          votesFor: BN(logData.votesFor).toString(),
          votesAgainst: BN(logData.votesAgainst).toString(),
          votesTotal: BN(logData.votesAgainst)
            .add(BN(logData.votesFor))
            .toString(),
        })
      case '_RewardClaimed':
        // If this log came from the User,
        // the User no longer has reward tokens to claim from this poll
        if (logData.voter === this.user) {
          return olderMatch.set('tokensToClaim', false)
        }
        return olderMatch
      case '_PollCreated':
        return olderMatch.merge({
          status: 'challenged',
          pollID: BN(logData.pollID).toString(),
        })
      default:
        console.log('unhandled event:', eventName)
        return olderMatch
    }
  }

  // Reduces a list of (maybe-newer) Listings, using a Map of (maybe-older) Listings as the starting value
  // Returns a Map of: { [Listing.listingHash]: Listing, ... }
  // newListings: Iterable List
  // listings:    Iterable Map
  replaceDuplicateListings(newListings, listings = fromJS({})) {
    return fromJS(newListings).reduce((acc, val) => {
      const match = acc.get(val.get('listingHash'))

      // CASE: duplicate listingHash
      if (match) {
        const valTimestamp = val.getIn(['latestBlockTxn', 'blockTimestamp'])
        const matchTimestamp = match.getIn(['latestBlockTxn', 'blockTimestamp'])

        // CASE: older log, return accumulation. Return the accumulation
        if (BN(valTimestamp).lt(BN(matchTimestamp))) {
          return acc
        }
      }

      // CASE: unique listingHash -or- newer log. Set the listing
      // state.listings: { Listing.listingHash: Listing }
      return acc.set(val.get('listingHash'), val)
    }, fromJS(listings)) // initial value
  }

  // Finds the corresponding listing according the eventName
  findMatchingListing(logData, listings, eventName) {
    console.log('logData, listings, eventName:', logData, listings, eventName)
    switch (eventName) {
      case '_Application':
      case '_Challenge':
      case '_ApplicationWhitelisted':
      case '_ApplicationRemoved':
      case '_ChallengeFailed':
      case '_ChallengeSucceeded':
      case '_ListingRemoved':
        return listings.get(logData.listingHash)
      case '_PollCreated':
      case '_VoteCommitted':
      case '_VoteRevealed':
        return listings.find((v, k) => {
          return v.get('pollID') === BN(logData.pollID).toString()
        })
      case '_RewardClaimed':
        return listings.find((v, k) => {
          return v.get('pollID') === BN(logData.challengeID).toString()
        })
      default:
        return false
    }
  }
}

module.exports = TCRListings
