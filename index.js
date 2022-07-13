'use strict';
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const { Client } = require("honeygain.js");
const fs = require('fs');
const { log, bytesToSize } = require("./util.js");
const cron = require('node-cron');
let file = fs.readFileSync('config.json');
let config = JSON.parse(file);
const hook = new Webhook(config.default_hookUrl);


let status = false;
cron.schedule('* */1 * * *', () => {
    run();
});

function run() {
    const clients = [];
    config.token_list.forEach((token_list) => {
        let client2 = new Client();
        client2.login(token_list.token);
        clients.push(client2);
    });
    for (let i = 0; i < config.token_list.length; i++) {
        const client = new Client();
        client.login(config.token_list[i].token);
        const getStats = async() => {
                let me = await client.me();
                let ref = me.data.referral_code;
                if (!fs.existsSync("data/")) fs.mkdirSync("./data");
                if (!fs.existsSync(`data/${ref}`)) fs.mkdirSync(`./data/${ref}`);
                config.command.forEach(async(task) => {
                            if (!fs.existsSync(`data/${ref}/${task}.json`))
                                fs.writeFileSync(`data/${ref}/${task}.json`, "{}");
                            if (!fs.existsSync(`data/${ref}/${task}_old.json`)) {
                                log(`Download ${task}`, "info");
                                let data;
                                switch (task) {
                                    case "jumpTaskStats":
                                        data = await client.jumpTaskStats();
                                        break;
                                    case "jumpTaskToday":
                                        data = await client.jumpTaskToday();
                                        break;
                                    case "jumpTaskEarnings":
                                        data = await client.jumpTaskEarnings();
                                        break;
                                    case "devices":
                                        data = await client.devices();
                                        break;
                                }
                                if (task == "jumpTaskToday") {
                                    fs.writeFileSync(
                                        `data/${ref}/${task}.json`,
                                        JSON.stringify(data, null, 1),
                                        "utf8"
                                    );
                                    fs.writeFileSync(
                                        `data/${ref}/${task}_old.json`,
                                        JSON.stringify(data, null, 1),
                                        "utf8"
                                    );
                                } else {
                                    fs.writeFileSync(
                                        `data/${ref}/${task}.json`,
                                        JSON.stringify(data, null, 1),
                                        "utf8"
                                    );
                                }

                            } else {
                                log(`Data Lama ${ref+` `+task} Ada Unduh Yang Baru, downloading...`, "info");
                                let data;
                                switch (task) {
                                    case "jumpTaskStats":
                                        data = await client.jumpTaskStats();
                                        break;
                                    case "jumpTaskToday":
                                        data = await client.jumpTaskToday();
                                        break;
                                    case "jumpTaskEarnings":
                                        data = await client.jumpTaskEarnings();
                                        break;
                                    case "devices":
                                        data = await client.devices();
                                        break;
                                }
                                fs.writeFileSync(
                                    `data/${ref}/${task}.json`,
                                    JSON.stringify(data, null, 1),
                                    "utf8"
                                );
                                       
                }
            });
            if(i == config.token_list.length-1){
                sleep(1000)
                status = true;
            }
        };
        
        getStats();
       
        
    }
    
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    function formatDate(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
    
        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;
    
        return [year, month, day].join('-');
    }
    
    let title = "Honeygain Earning Notification";
    let description = "Earning Updated Check Below";
    let color = "#00b0f4";
    let thumbnail = "https://cdn.discordapp.com/attachments/996420829149667429/996420966949331054/1.png";
    let footer_desc = "Report Generated By MuhSyahrul | ";
    let footer_image = "https://cdn.discordapp.com/attachments/996420829149667429/996420966949331054/1.png";
    let earning_today = 0;
    let earning_today_plus = 0;
    let traffic_today = 0;
    let traffic_today_plus = 0;
    let date = new Date();
    let yesterday_1 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
    let yesterday_2 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 2);
    let yesterday_3 = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 3);
    let traffic_yesterday_1 = 0;
    let traffic_yesterday_2 = 0;
    let traffic_yesterday_3 = 0;
    
    async function post(){
        await sleep(1000);
        let ref_list = [];
        let traffic_today_array = [];
        if (status){
            for (let i = 0; i < clients.length; i++){
                let me = await clients[i].me();
                let ref = me.data.referral_code;
                ref_list.push(ref);
                let jumpTaskTodayFile = fs.readFileSync(`data/${ref}/jumpTaskToday.json`);
                let jumpTaskToday = JSON.parse(jumpTaskTodayFile);
                let jumpTaskTodayFile_old = fs.readFileSync(`data/${ref}/jumpTaskToday_old.json`);
                let jumpTaskToday_old = JSON.parse(jumpTaskTodayFile_old);
                let jumpTaskStatsFile = fs.readFileSync(`data/${ref}/jumpTaskStats.json`);
                let jumpTaskStats = JSON.parse(jumpTaskStatsFile);
                earning_today += jumpTaskToday.total.credits;
                earning_today_plus += jumpTaskToday.total.credits - jumpTaskToday_old.total.credits;
                traffic_today += jumpTaskToday.gathering.bytes;
                traffic_today_plus += jumpTaskToday.gathering.bytes - jumpTaskToday_old.gathering.bytes;
                traffic_yesterday_1 += jumpTaskStats[formatDate(yesterday_1)].gathering.traffic;
                traffic_yesterday_2 += jumpTaskStats[formatDate(yesterday_2)].gathering.traffic;
                traffic_yesterday_3 += jumpTaskStats[formatDate(yesterday_3)].gathering.traffic;
                fs.rename(`data/${ref}/jumpTaskToday.json`, `data/${ref}/jumpTaskToday_old.json`, function(err) {
                    if (err) console.log('ERROR: ' + err);
                    console.log("Update Success")
                });
                traffic_today_array.push(jumpTaskToday.gathering.bytes)
            }
            
            const embed = new MessageBuilder()
                .setTitle(title)
                .setAuthor('Honeygain', thumbnail)
                .setColor(color)
                .setThumbnail(thumbnail)
                .setDescription(description)
                .setFooter(footer_desc, footer_image)
                .setTimestamp();
                embed.addField('Credits Today', ':bee: '+earning_today+' :arrow_double_up: '+(earning_today_plus).toFixed(2), false)
                embed.addField('Earning Today', ':dollar: $'+(earning_today/1000).toFixed(2)+' :arrow_double_up: $'+(earning_today_plus/1000).toFixed(2), false)
                embed.addField('Traffic Today', ':bar_chart: '+bytesToSize(traffic_today.toFixed(1))+' :arrow_double_up: '+bytesToSize(traffic_today_plus.toFixed(1)), false)
                embed.addField('Traffic History',':date:'+' '+formatDate(yesterday_1)+'\n'+':bar_chart: '+bytesToSize(traffic_yesterday_1.toFixed(1))+'\n\n'+':date:'+' '+formatDate(yesterday_2)+'\n'+':bar_chart: '+bytesToSize(traffic_yesterday_2.toFixed(1))+'\n\n'+':date:'+' '+formatDate(yesterday_3)+'\n'+':bar_chart: '+bytesToSize(traffic_yesterday_3.toFixed(1)), false)
                let total_device = 0;
                let total_active_device =0;
                for(let i=0; i < ref_list.length;i++){
                    let deviceFile = fs.readFileSync(`data/${ref_list[i]}/devices.json`);
                    let device = JSON.parse(deviceFile);
                    let data = device.data;
                    let active = data.filter((data) => data.status === "active");
                    total_device += data.length;
                    total_active_device += active.length;
                    embed.addField(':desktop: '+ref_list[i], ':bar_chart: '+bytesToSize(traffic_today_array[i].toFixed(1))+' :white_check_mark: '+active.length+' :x: '+(data.length-active.length), false)
                }
                embed.addField('Total Account & Device', ':desktop: '+ref_list.length+' :white_check_mark: '+total_active_device+' :x: '+(total_device-total_active_device), false)
                hook.send(embed);
            
        }else{
            await sleep(1000);
            post();
        }
    }
    post();
}