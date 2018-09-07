const test = require('tape')
// const path = require('path')
// const sortBy = require('lodash/fp/sortBy')
// const low = require('lowdb')
// const FileSync = require('lowdb/adapters/FileSync')
// const db = low(new FileSync(path.resolve(__dirname, '../db/store.json')))
// db.defaults({ listings: {}, applicationLogs: [], nonApplicationLogs: [] }).write()
// const { getInDB, getListingsDB, setToDB } = require('../db')
const TCRListings = require('../lib')

test('getListings', async t => {
  // let localCandidatesMap = getListingsDB(db)
  // const localListings = Object.keys(localCandidatesMap).map(liHash => localCandidatesMap[liHash])

  // const aLogs = getInDB(db, 'applicationLogs')
  // const nLogs = getInDB(db, 'nonApplicationLogs')
  // const applicationLogs = sortBy([log => log.txData.blockTimestamp], aLogs)
  // const nonApplicationLogs = sortBy([log => log.txData.blockTimestamp], nLogs)

  const tcrListings = new TCRListings(
    [],
    [],
    // applicationLogs,
    // nonApplicationLogs,
    '0xd09cc3bc67e4294c4a446d8e4a2934a921410ed7'
  )
  const listingsMap = await tcrListings.getListings()

  console.log('# total candidates:', listingsMap.size)
  console.log('listingsMap.toJS():', listingsMap.toJS())

  // setToDB(db, 'listings', listingsMap.toJS())

  t.end()
})
