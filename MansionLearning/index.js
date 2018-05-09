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
const MainAddress = "https://www.athome.co.jp/chintai/tokyo/nerima-st/list";

//puppeteer.launch({headless: false, slowMo: 250}).then(async browser => {
puppeteer.launch().then(async browser => {
    const page = await browser.newPage();
    await page.goto(MainAddress, { waitUntil:"load" });

    const dataBukkenTitles = await page.evaluate(() => {
        const node = document.querySelectorAll("h2.p-property__title");
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
    console.log(dataBukkenTitles);
    
    const dataBukkenDetails = {};
    for(let i = 0; i < dataBukkenTitles.length; ++i) {
        const subPage = await browser.newPage();
        await subPage.goto(RootAddress + dataBukkenTitles[i][1], { waitUntil: "load" });

        const dataDetail = await subPage.evaluate(() => {
            const node = document.querySelectorAll("dl.data.typeTable");
            const data = {};
            for(item of node) {
                const dt = item.getElementsByTagName('dt');
                const dd = item.getElementsByTagName('dd');
                for(let j = 0; j < dt.length; ++j) {
                    data[dt[j].innerText] = dd[j].innerText
                }
            }
            return data;
        });
        dataBukkenDetails[dataBukkenTitles[i][0]] = dataDetail;
        console.log(dataDetail);

        await sleep(3000);

        subPage.close();
    }
    console.log(dataBukkenDetails);

    fs.writeFileSync('data.txt', JSON.stringify(dataBukkenDetails, null, "\t"));

    await browser.close();
});