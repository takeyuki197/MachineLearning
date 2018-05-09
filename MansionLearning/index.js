const puppeteer = require('puppeteer');

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
            data.push(array);
        }
        return data;
    });
    console.log(dataBukkenTitles);
    
    const dataBukkenDetails = [];
    for(let i = 0; i < dataBukkenTitles.length; ++i) {
        const subPage = await browser.newPage();
        await subPage.goto(RootAddress + dataBukkenTitles[i][1], { waitUntil: "load" });

        const dataDetail = await subPage.evaluate(() => {
            const node = document.querySelectorAll("dl.data.typeTable");
            let data = [];
            for(item of node) {
                const dt = item.getElementsByTagName('dt');
                const dd = item.getElementsByTagName('dd');
                const array = [];
                for(let j = 0; j < dt.length; ++j) {
                    array.push(dt[j].innerText);
                    array.push(dd[j].innerText);
                }
                data = data.concat(array);
            }
            return data;
        });
        dataBukkenDetails.push(dataDetail);
        console.log(dataDetail);

        subPage.close();
    }
    console.log(dataBukkenDetails);

    await browser.close();
});