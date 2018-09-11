const test = require('tape')
const TCRListings = require('../lib')

const appLogs = [
  {
    logData: {
      listingHash: '0x2b25a26e8f9f85d5c41a9ca403de212bc337b884016649d7b70ecf7509367a60',
      deposit: '15d3ef79800',
      appEndDate: 1524781525,
      data: 'QmQejD363dLdKKGK8aKMtfLd8p9rsn76aC98c3hF2XQUrH',
      applicant: '0x6C439E156C0571b9e9174C4AC440018515dea1F4',
      length: 5,
    },
    txData: {
      txHash: '0x55ea08194a3b3560a72fa72013fe67c48f8a33924e7483355b203adfd441a635',
      logIndex: 5,
      blockNumber: 5470807,
      blockTimestamp: 1524176725,
    },
    contractAddress: '0x5E2Eb68A31229B469e34999C467b017222677183',
    eventName: '_Application',
  },
  {
    logData: {
      listingHash: '0xb974fe9dcf0345050d368c0318e40c6fc3c23b3deb67dcc8717cfc443a9208cf',
      deposit: '15d3ef79800',
      appEndDate: 1525150946,
      data: 'espn.com',
      applicant: '0x135293B01269BC8C2c6756a70404a7a8ab60730a',
      length: 5,
    },
    txData: {
      txHash: '0xa7f910fe1e208b52808fc02b0449fbb20c536e9e3a79b187bd7be7d8ea9d8f8a',
      logIndex: 105,
      blockNumber: 5495682,
      blockTimestamp: 1524546146,
    },
    contractAddress: '0x5E2Eb68A31229B469e34999C467b017222677183',
    eventName: '_Application',
  },
]

const chalLogs = [
  {
    logData: {
      listingHash: '0x2b25a26e8f9f85d5c41a9ca403de212bc337b884016649d7b70ecf7509367a60',
      challengeID: '1',
      data: '',
      commitEndDate: 1524940245,
      revealEndDate: 1525640245,
      challenger: '0x7609E21921C7EFCF73a588833Bf7709889291781',
      length: 6,
    },
    txData: {
      txHash: '0x5c7d1f49d1433a0b8d5446f2ee51837609edfed997eb4f15e4e28c3d5c9ed0f9',
      logIndex: 124,
      blockNumber: 5495282,
      blockTimestamp: 1524540245,
    },
    contractAddress: '0x5E2Eb68A31229B469e34999C467b017222677183',
    eventName: '_Challenge',
  },
]

test('getListings', async t => {
  // Get logs
  const tcrListings = new TCRListings(
    '0xd09cc3bc67e4294c4a446d8e4a2934a921410ed7'
  )
  const listingsMap = await tcrListings.getListings(appLogs, chalLogs, {})

  console.log('# total candidates:', listingsMap.size)
  console.log('listingsMap.toJS():', listingsMap.toJS())
  t.assert(listingsMap.toJS()['0x2b25a26e8f9f85d5c41a9ca403de212bc337b884016649d7b70ecf7509367a60'].listingID, 'hidden.computer')
  t.end()
})
