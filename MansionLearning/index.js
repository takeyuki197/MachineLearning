const fs = require('fs');
const scrayping = require('./scrayping');
const controlDB = require('./controlDB');

const today = new Date;
const todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
const outputCSVName = './data/bunjou_' + todayString + '.csv';
const options = {
    maxDataSize: -1
};

/*
(async function(){
    for(let iLoop = 0; iLoop < 100; ++iLoop){
        const json_data = fs.readFileSync('./time_FromShinjuku.json', 'utf8');
        const transit_data = JSON.parse(json_data);
        const content = fs.readFileSync('./list_eki.csv', 'utf8');
        const dest = content.split('\r\n').map(function (element) { return element.trim(); });
        let isSuccess = true;
        const results = await scrayping.getTransitTime(transit_data, dest);
        if (results[0]) {
            isSuccess = false;
            console.log(results[0].message);
            fs.writeFileSync('./time_FromShinjuku.json', JSON.stringify(results[2], null, "\t"));
        } else {
            fs.writeFileSync('./time_FromShinjuku.json', JSON.stringify(results[2], null, "\t"));
        }
        if (isSuccess) { break; }
    }
})();
*/

fs.writeFileSync(outputCSVName, '');
scrayping.getScrapedData(outputCSVName, options, function(data){
    fs.writeFileSync('./data/bunjou_' + todayString + '.json', JSON.stringify(data.json, null, "\t"));
});


//controlDB.query(function(err, res){
//    console.log(res);
//});