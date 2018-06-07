const fs = require('fs');
const scrayping = require('./scrayping');
const controlDB = require('./controlDB');

const today = new Date;
const todayString = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
const outputCSVName = './data/bunjou_' + todayString + '.csv';
const options = {
    maxDataSize: -1
}


const json_data = fs.readFileSync('./time_FromShinjuku.json', 'utf8');
const transit_data = JSON.parse(json_data);
const content = fs.readFileSync('./list_eki.csv', 'utf8');
const dest = content.split('\r\n').map(function (element) { return element.trim()});
scrayping.getTransitTime(transit_data, dest, function(err, data_array, data_dict){
    //console.log(data_array);
    //console.log(data_dict);
    if (err) {
        console.log(err.message);
    }
    fs.writeFileSync('./time_FromShinjuku.json', JSON.stringify(data_dict, null, "\t"));
});


fs.writeFileSync(outputCSVName, '');
scrayping.getScrapedData(outputCSVName, options, function(data){
    fs.writeFileSync('./data/bunjou_' + todayString + '.json', JSON.stringify(data.json, null, "\t"));
});


//controlDB.query(function(err, res){
//    console.log(res);
//});