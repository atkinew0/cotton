const file = require('fs')
const cors = require('cors')
const SerialPort = require('serialport');
const express = require('express')
const app = express()
const Readline = require('@serialport/parser-readline')
const port = 3000
const parser = new Readline({delimiter: '\r'});
const { Transform } = require('stream')

const config = require('./config.json')

console.log("server read config file: ",config);

class toTime extends Transform {
    constructor(){
        super()
    }

    _transform(chunk, enc, done){


        let d = new Date()
        

        let time = d.getTime();
        console.log("raw string below:")
        console.log(chunk.toString("utf8"))
        let line = chunk.toString("utf8").split(/(\s+)/).filter((elem) => !elem.match(/(\s+)/));
        console.log("string now split to ", line);
        let final = []
        final.push(time);
        final.push(line[5]);
        final.push(line[7]);

        let finalString = final.toString("utf8") +"\n"

        done(null, finalString)



    }
}

let timer = new toTime()

app.use(cors())

const serialPort = new SerialPort('/dev/ttyUSB0', { baudRate: 9600 }, function (err) {

    if (err) {
        return console.log("Error : " + err);
    }
}
)

app.get('/gin', (req, res) => {


    res.send(config);


})



app.get('/latest/:cutoff', (req, res) => {

    let cutoff = parseInt(req.params.cutoff);

    file.readFile('mock_bales.txt', 'utf8', (err, data) => {

        if (err) console.log("Read error:", err);


        let lines = data.trim().split("\n");
        let bales_data = {};
        let bales_list = []

        for(let i = 0; i < lines.length; i++){
            let item = lines[i].split(",");

            // let d = new Date()
            // let cutoff = d.getTime() - (1000 * 60 * 60);        //in response to GET /latest send bales from previous 1 hr

            if(item[0] > cutoff){

                bales_list.push({time: item[0], tag: item[1], weight: item[2]});
            }
        }

        bales_data.bales = {list: bales_list};

        res.send(bales_data);
    });

});

app.listen(port, () => console.log(`Example app listening at http ://localhost:${port}`));



const stream = file.createWriteStream("bales.txt", {flags:'a'});

serialPort.pipe(parser).pipe(timer).pipe(stream, {end: false});

