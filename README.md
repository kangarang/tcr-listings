# tcr-listings

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fkangarang%2Ftcr-listings.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fkangarang%2Ftcr-listings?ref=badge_shield)

Module for creating and updating TCR listings

## Install

    npm install --save tcr-listings

## Usage

```js
import TCRListings from 'tcr-listings'

// Address to calculate tokenClaims & userVoteNumTokens
const accountAddress = '0x0123456789DEADBEAFCAFE'
const tcrListings = new TCRListings(accountAddress)

// Array of _Application logs
const applicationLogs = [
  {
    logData: {
      listingHash: '0x11b225fe8d80e492d300a2f2da631db014203e1d17c046808254d52531743cac',
      deposit: '10000000000000000000',
      appEndDate: '1537548813',
      data: 'data',
      applicant: '0x0123456789DEADBEEFCAFE',
      length: 5,
    },
    txData: {
      txHash: '0x159b6274ed2eca6e2890f1715e56e044f97721cc25f5f567f7aff21e6ae17d18',
      logIndex: 3,
      blockNumber: 3028095,
      blockTimestamp: 1537548213,
    },
    contractAddress: '0xDEADBEEFCAFE0123456789',
    eventName: '_Application',
  },
]

// Array of non-_Application logs
const nonApplicationLogs = [
  // { ... }
]

// Optional: object of current listings (for updating)
const localListings = {
  0x11b225fe8d80e492d300a2f2da631db014203e1d17c046808254d52531743cac: {
    latestBlockTxn: {
      txHash: '0x067721b90d63b0b2bf7ad33d6e337647ec9704645529ee6b5acbb69279e0674a',
      logIndex: 58,
      blockNumber: 6001454,
      blockTimestamp: 1333569875,
    },
    appEndDate: '1333599416',
    data: 'data',
    whitelistBlockTimestamp: '1333599875',
    listingHash: '0xa1b0c90bb32d5c46ec5baec637f8cc3d8071588be36eaca4d87fe5c9641a5138',
    status: 'whitelisted',
    owner: '0x0123456789DEADBEEFCAFE',
    latestEvent: '_ApplicationWhitelisted',
    listingID: 'data',
  },
}

// Create listings from _Application logs,
// Update current listings w/ new logs
// Update current listings w/ new listings
const listingsMap = await tcrListings.getListings(
  applicationLogs,
  nonApplicationLogs,
  localListings
)
```

## Test

    npm test

## License

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fkangarang%2Ftcr-listings.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fkangarang%2Ftcr-listings?ref=badge_large)
