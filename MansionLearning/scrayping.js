const puppeteer = require('puppeteer');
const fs = require('fs');

function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

const RootAddress = "https://www.athome.co.jp";
const MainAddress = "https://www.athome.co.jp/mansion/chuko/tokyo/list/";

/**
 * 
 * @param {*} outputCSVName 
 * @param {*} options 
 * @param {*} callback 
 */
exports.getScrapedData = function(outputCSVName, options, callback){

    //puppeteer.launch({devtools: true, slowMo: 250}).then(async browser => {
    puppeteer.launch().then(async browser => {
        const page = await browser.newPage();
        await page.setJavaScriptEnabled(true);
        await page.goto(MainAddress, { waitUntil: 'networkidle0' });

        let preBukkenNumStr, postBukkenNumStr;

        preBukkenNumStr = await page.evaluate(() => {return document.querySelector("p.item-list_result.left span.counter span.num").innerText;});
        await page.select('select[name="MENSEKI"]', 'kt109');
        await page.select('select[name="EKITOHO"]', 'ke003');
        await page.waitFor(1000);    
        await page.waitForFunction('document.querySelector("p.item-list_result.left span.counter span.num").innerText !== "' + preBukkenNumStr + '"');
        postBukkenNumStr = await page.evaluate(() => {return document.querySelector("p.item-list_result.left span.counter span.num").innerText;});
        console.log("The number of Bukken becomes " + preBukkenNumStr + ' => ' + postBukkenNumStr);
        preBukkenNumStr = postBukkenNumStr;

        await page.click('img#dev-replaceSecondImage', { waitUntil: 'networkidle0' });
        await page.waitFor(1000);
        const frameData = await page.frames();
        let iModal = frameData.length - 1;
        for (let i = 0; i < frameData.length; ++i) {
            //console.log('frame name ' + String(i) + ': ' + frameData[i].name());
            if (frameData[i].name().indexOf('152680') === 0) {
                iModal = i;
                break;
            }
        }
        await frameData[iModal].waitFor(1000);
        await frameData[iModal].waitForSelector('input#dummy_ov_01');
        await frameData[iModal].evaluate(() => {
            var a = document.getElementById('dummy_ov_01');
            var event = new MouseEvent('click', {});
            a.dispatchEvent(event);
        });
        await frameData[iModal].waitForSelector('img[alt="検索結果を見る"]');
        await frameData[iModal].click('img[alt="検索結果を見る"]');

        await page.waitFor(1000);
        await page.waitForFunction('document.querySelector("p.item-list_result.left span.counter span.num").innerText !== "' + preBukkenNumStr + '"');
        postBukkenNumStr = await page.evaluate(() => { return document.querySelector("p.item-list_result.left span.counter span.num").innerText; });
        console.log("The number of Bukken becomes " + preBukkenNumStr + ' => ' + postBukkenNumStr);

        const bukkenNumStr = postBukkenNumStr;
        const bukkenNum = parseInt(bukkenNumStr.split(',').join('').trim());
        const pageNum = Math.floor(bukkenNum / 30) + 1;
        console.log("The number of page is " + pageNum);

        const maxDataSize = options.maxDataSize || -1;
        const dataBukkenDetails = {};
        const csv_data = [];
        const csv_header = [];
        let dataNum = 0;
        for (let iPage = 1; iPage <= pageNum; ++iPage) {
            if (iPage >= 2) {
                const pageText = await page.evaluate(() => {
                    return document.querySelector("p.item-list_result.left").innerText;
                });
                const searchString = 'a[page="' + String(iPage) + '"';
                await page.click(searchString);
                await page.waitFor(1000);
                await page.waitForFunction('document.querySelector("p.item-list_result.left").innerText !== "' + pageText + '"');
                const postPageText = await page.evaluate(() => {return document.querySelector("p.item-list_result.left").innerText;});
                console.log('Page changes from "' + pageText + '" to "' + postPageText + '"');
            }   

            const dataBukkenTitles = await page.evaluate(() => {
                const node = document.querySelectorAll("p.heading.object-title");
                const data = [];
                for(item of node) {
                    const bukkenName = item.innerText;
                    const bukkenWebAddress = item.getElementsByTagName('a')[0].getAttribute('href');
                    const array = [bukkenName, bukkenWebAddress];
                    //data[bukkenName] = bukkenWebAddress;
                    data.push(array);
                }
                return data;
            });
            
            for(let i = 0; i < dataBukkenTitles.length; ++i) {
                dataNum += 1;
                if (maxDataSize >= 0 && dataNum > options.maxDataSize) {
                    break;
                }

                const subPage = await browser.newPage();
                await subPage.goto(RootAddress + dataBukkenTitles[i][1], { waitUntil: "domcontentloaded" });

                const dataDetail = await subPage.evaluate(() => {
                    const node = document.querySelector("section#item-detail_data").querySelectorAll("tr");
                    const data = {};
                    for(item of node) {
                        const th = item.getElementsByTagName('th');
                        const td = item.getElementsByTagName('td');
                        for(let j = 0; j < th.length; ++j) {
                            data[th[j].innerText] = td[j].innerText.split('\n').join(' ')
                        }
                    }
                    return data;
                });
                dataBukkenDetails[dataBukkenTitles[i][0]] = dataDetail;
                console.log("Get bukken data: " + dataBukkenTitles[i][0]);

                if (csv_header.length === 0) {
                    let line = '"タイトル"';
                    for (let key of Object.keys(dataDetail)) {
                        csv_header.push(key);
                        line += ',"' + key + '"';
                    }
                    line += '\n';
                    fs.appendFileSync(outputCSVName, line);
                }
                let line = '';
                line += '"' + dataBukkenTitles[i][0] + '"';
                for (let key of csv_header) {
                    line += ',"' + dataDetail[key] + '"';
                }
                line += '\n';
                fs.appendFileSync(outputCSVName, line);

                await sleep(2000);
                await subPage.close();
            }

            if (maxDataSize >= 0 && dataNum > maxDataSize) {
                break;
            }
        }
        
        await browser.close();

        const ret = {
            json: dataBukkenDetails,
            csv: csv_data
        }
        return callback(ret);
    });
}