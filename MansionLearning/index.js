const fs = require('fs');
const scrayping = require('./scrayping');
const controlDB = require('./controlDB')

const today = new Date;
const todayString = today.getFullYear() + '-' + today.getMonth() + '-' + today.getDate();
const outputCSVName = 'bunjou_' + todayString + '.csv';
const options = {
    maxDataSize: -1
}

fs.writeFileSync(outputCSVName, '');
scrayping.getScrapedData(outputCSVName, options, function(data){
    fs.writeFileSync('bunjou_' + todayString + '.json', JSON.stringify(data.json, null, "\t"));

    /* let outputString = '';
    for (let row = 0; row < data.csv.length; ++row) {
        outputString += '"' + data.csv[row][0].split('\n').join('') + '"';
        for (let column = 1; column < data.csv[row].length; ++column) {
            if (data.csv[row][column]) {
                outputString += ',"' + data.csv[row][column].split('\n').join('') + '"';
            } else {
                outputString += ',""';
            }
        }
        outputString += '\n';
    }
    fs.writeFileSync('bunjou_' + todayString + '.csv', outputString); */
});

//controlDB.query(function(err, res){
//    console.log(res);
//});