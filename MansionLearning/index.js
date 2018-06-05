const fs = require('fs');
const scrayping = require('./scrayping');
const controlDB = require('./controlDB');

const today = new Date;
const todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
const outputCSVName = './data/bunjou_' + todayString + '.csv';
const options = {
    maxDataSize: -1
}

const dest = ["練馬", "中野坂上"]
scrayping.getTransitTime(dest, function(err, data){
    console.log(data);
});

fs.writeFileSync(outputCSVName, '');
scrayping.getScrapedData(outputCSVName, options, function(data){
    fs.writeFileSync('./data/bunjou_' + todayString + '.json', JSON.stringify(data.json, null, "\t"));
});

//controlDB.query(function(err, res){
//    console.log(res);
//});