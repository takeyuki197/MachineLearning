const puppeteer = require('puppeteer');
const fs = require('fs');

function sleep(time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

async function retry(maxTry, triedFunc) {
    for (let i = 0; i < maxTry; ++i) {
        let success = true;
        try {
            await triedFunc();
        } catch (err) {
            if (i == maxTry - 1) {
                throw err;
            } else {
                success = false;
            }
        }
        if (success) {
            break;
        }
    }
    return;
}


/**
 * 
 * @param {*} outputCSVName 
 * @param {*} options
 */
exports.getScrapedData = async function(outputCSVName, options){
    const RootAddress = "https://www.athome.co.jp";
    const MainAddress = "https://www.athome.co.jp/mansion/chuko/tokyo/list/";

    //const browser = await puppeteer.launch({devtools: true, slowMo: 250});
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(true);
    await page.setRequestInterception(true);
    page.on('request', request => {
        if (request.resourceType() === 'image')
        request.abort();
        else
        request.continue();
    });

    await retry(3, async function(){ await page.goto(MainAddress, { waitUntil: 'networkidle0' }) });

    let preBukkenNumStr, postBukkenNumStr;

    preBukkenNumStr = await page.evaluate(() => {return document.querySelector("p.item-list_result.left span.counter span.num").innerText;});
    await page.select('select[name="MENSEKI"]', 'kt110');
    await page.select('select[name="EKITOHO"]', 'ke101');
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
    const unpush = [
        'dummy_ov_01_6', 'dummy_ov_01_7', 'dummy_ov_01_8', 'dummy_ov_01_18',
        'dummy_ov_01_21', 'dummy_ov_01_22', 'dummy_ov_01_23'
    ];
    for (let i = 0; i < unpush.length; ++i) {
        await frameData[iModal].waitFor(1000);
        await frameData[iModal].waitForSelector('input#' + unpush[i]);
        //await frameData[iModal].click('input#' + unpush[i]);
        const res = await frameData[iModal].evaluate((selector) => {
            var a = document.getElementById(selector);
            a.checked = false;
            return a.checked;
        }, unpush[i]);
        console.log(res);
        if (res) {
            console.log('repush');
            await frameData[iModal].click('input#' + unpush[i]);
            const res2 = await frameData[iModal].evaluate((selector) => {
                var a = document.getElementById(selector);
                return a.checked;
            }, unpush[i]);
            console.log(res2)
        }
    }
    await frameData[iModal].waitFor(1000);
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
            await subPage.setRequestInterception(true);
            subPage.on('request', request => {
                if (request.resourceType() === 'image')
                request.abort();
                else
                request.continue();
            });

            await retry(3, async function(){ await subPage.goto(RootAddress + dataBukkenTitles[i][1], { waitUntil: "domcontentloaded" }) });

            const dataDetail = await subPage.evaluate(() => {
                const detail_data = document.querySelector("section#item-detail_data");
                if (!detail_data) {
                    return [-1, {}];
                }
                const node = detail_data.querySelectorAll("tr");
                const data = {};
                for(item of node) {
                    const th = item.getElementsByTagName('th');
                    const td = item.getElementsByTagName('td');
                    for(let j = 0; j < th.length; ++j) {
                        if (th[j].innerText !== ' ') {
                            data[th[j].innerText] = td[j].innerText.split('\n').join(' ')
                        }
                    }
                }
                return [0, data];
            });
            if (dataDetail[0] == 0) {
                dataBukkenDetails[dataBukkenTitles[i][0]] = dataDetail[1];
                console.log("Get bukken data: " + dataBukkenTitles[i][0]);
            } else {
                console.log("Fail to get bukken data: " + dataBukkenTitles[i][0]);
            }

            if (csv_header.length === 0) {
                let line = '"タイトル"';
                for (let key of Object.keys(dataDetail[1])) {
                    if (key != ' '){
                        csv_header.push(key);
                        line += ',"' + key + '"';
                    }
                }
                line += '\n';
                fs.appendFileSync(outputCSVName, line);
            }
            let line = '';
            line += '"' + dataBukkenTitles[i][0] + '"';
            for (let key of csv_header) {
                line += ',"' + dataDetail[1][key] + '"';
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
    return ret;
}


exports.getTransitTime = async function (inTransitData, inDestination) {
    const MainAddress = 'https://transit.yahoo.co.jp/';
    let output_data = Object.assign({}, inTransitData);

    //puppeteer.launch({devtools: true, slowMo: 250}).then(async browser => {
    const browser = await puppeteer.launch();
    const transit_times = [];
    for (let i = 0; i < inDestination.length; ++i){
        if (output_data[inDestination[i]]) {
            continue;
        } else {
            try {
                const page = await browser.newPage();
                await page.setJavaScriptEnabled(true);
                await page.setRequestInterception(true);
                page.on('request', request => {
                    if (request.resourceType() === 'image')
                    request.abort();
                    else
                    request.continue();
                });

                retry(3, async function () { await page.goto(MainAddress, { waitUntil: 'networkidle0' }) });
                await page.type("#sfrom", "新宿");
                await page.type("#sto", inDestination[i]);
                await page.select('select#hh', '09');
                await page.select('select#mm', '00');
                page.click('input#searchModuleSubmit');
                await page.waitForNavigation({ waitUntil: 'networkidle0' });
                //await page.evaluate(() => {
                //    $('form[name="search"]').submit();
                //});
                await page.waitForSelector('div#route01');
                const timeStr = await page.evaluate(() => {
                    return $('div#route01 li.time').html()
                });
                console.log(inDestination[i] + ': ' + timeStr);
                const lpos = timeStr.lastIndexOf('>');
                const rpos = timeStr.lastIndexOf('（');
                transit_times.push(timeStr.slice(lpos+1, rpos).replace(' ', ''));
                output_data[inDestination[i]] = timeStr.slice(lpos+1, rpos).replace(' ', '');
                await page.close()
            } catch(err) {
                return [err, transit_times, output_data];
            }
        }
    }
    return [null, transit_times, output_data];
}