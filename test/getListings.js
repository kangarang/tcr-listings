const test = require('tape')
const TCRListings = require('../lib')

test('getListings', async t => {
  // Get logs

  const tcrListings = new TCRListings(
    [], // applicationLogs,
    [], // nonApplicationLogs,
    '0xd09cc3bc67e4294c4a446d8e4a2934a921410ed7'
  )
  const listingsMap = await tcrListings.getListings()

  console.log('# total candidates:', listingsMap.size)
  console.log('listingsMap.toJS():', listingsMap.toJS())
  t.end()
})
