const fs = require('fs');
const scrayping = require('./scrayping');
const controlDB = require('./controlDB')

const options = {
    maxDataSize: 5
}
//scrayping.getScrapedData(options, function(data){
//    fs.writeFileSync('data.txt', JSON.stringify(data, null, "\t"));
//});

controlDB.query(function(err, res){
    console.log(res);
});