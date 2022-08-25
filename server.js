//server.js
//functions required by server-side application

//required modules
var util = require('util');
var fs = require('fs');
const {resolve} = require('path');
const { raw } = require('body-parser');
const { time } = require('console');
const { Z_ASCII } = require('zlib');

//globals
const readDir = util.promisify(fs.readdir)
const exec = util.promisify(require('child_process').exec);
const streamRoot = "/data2/ftps/";
const transRoot = "/data/app/TagViewer/public/translations.json";
const depositRoot = "/data/app/TagViewer/public/";
const translations = require(transRoot);
const tsLength = 2400; //ts file duration in milliseconds

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//helper function to read from JSON asynchronously (allegedly - no async??), without caching
var readJson = (path, cb) => {
    fs.readFile(require.resolve(path), (err, data) => {
        if(err){
            cb(err);
        }//if
        else{
            cb(null, JSON.parse(data));
        }//else
    })//readFile
}//readJson

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

function getOptTranslation(streamDict){
    //streamDict looks like ----> {opt1: [enc1, ... encN], ... optN: []}
    //translation matrix should look like ----> {opt1: [enc1, ... encN], ... optN: []}

}//getTranslation

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

async function getFiles(dir, count = 0) {
    const dirents = await readDir(dir, {withFileTypes: true});
    const files = await Promise.all(dirents.map((dirent) => {
        const res = resolve(dir, dirent.name);
        //return dirent.isDirectory() ? getFiles(res, 1) : res;
        if(dirent.isDirectory() && count < 1) {
            return getFiles(res, count+1);
        }//if
        else {
            return res;
        }//else
    }));
    return files.flat();
}

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//function to read live streams directory and return a list of HTML select options for encoders
async function getLive(){
    var a, b;
    await getFiles(streamRoot) //set to /data2/ftps/ on return to VMTAGHLS
    .then((files) => {
        var streamDict = {};
	for(i = 0; i < files.length; i++){
	    if(!(files[i].includes('.m3u8'))){
		files.splice(i,1);
		i--;
	    }//if
	}//for
        for(i = 0; i < files.length; i++){
            rawPathElements = files[i].toString().split(/\/|,/g); //set to (/\/|,/g) on return to VMTAGHLS
            key = rawPathElements[rawPathElements.length-2];
            value = rawPathElements[rawPathElements.length-1];
            if(!streamDict[key]){
                streamDict[key] = [value];
            }//if
            else{
                streamDict[key].push(value);
            }//else
        }//for
        return streamDict;
    })//then
    .then((streamDict) => {
        var optTransDict = {};
        var keys = Object.keys(streamDict);
        for(i = 0; i < keys.length; i++){
            var opt = keys[i];
            if(translations['opt'].hasOwnProperty(opt)) {
                optTransDict[translations['opt'][opt]] = streamDict[opt];
            }//if
            else{
                optTransDict[opt] = streamDict[opt];
            }//else
        }//for
        return [optTransDict, streamDict];
    })//then
    .then((tuple) => {
        //transDict looks like {opt: ["enc1", "enc2"], opt2: ...}
        var transDict = tuple[0];
        var streamDict = tuple[1];
        var encTransDict = {};
        var keys = Object.keys(transDict);
        var values = Object.values(transDict);
        var encoderTranslations = translations['enc'];

        for(var i = 0; i < values.length; i++){
            for(var j = 0; j < values[i].length; j++){
                var cleanEnc = values[i][j].toString().split("_");
                if(cleanEnc.length > 1){
                    values[i][j] = cleanEnc[0] + "_" + cleanEnc[1].split('.')[0];
                }//if
            }//for
        }//for

        //scan across transDict -- for loop
        for(var i = 0; i < keys.length; i++) {
            var opt = keys[i];
            var arrayCheck = Array.isArray(values[i]) && values[i].length > 1;
            if(arrayCheck) {
                for(var j = 0; j < values[i].length; j++){
		    var isTranslatable = encoderTranslations.hasOwnProperty(values[i][j]);
                    if(isTranslatable){
                        opt in encTransDict ? encTransDict[opt].push(encoderTranslations[values[i][j]]) : encTransDict[opt] = [encoderTranslations[values[i][j]]];
                    }//if
                    else{
                        opt in encTransDict ? encTransDict[opt].push(values[i][j]) : encTransDict[opt] = [values[i][j]];
                    }//else
                }//for
            }//if
            else{
                var isTranslatableNonArray = encoderTranslations.hasOwnProperty(values[i][0]);
                if(isTranslatableNonArray){
                    opt in encTransDict ? encTransDict[opt].push(encoderTranslations[values[i][0]]) : encTransDict[opt] = [encoderTranslations[values[i][0]]];
                }//if
                else{
                    opt in encTransDict ? encTransDict[opt].push(values[i][0]) : encTransDict[opt] = [values[i][0]];
                }
            }//else
        }//for
        return [encTransDict, streamDict];
    })//then
    .then((tuple) => {
        var transDict = tuple[0];
        var streamDict = tuple[1];
        a = populateList(transDict);
        b = populateList(streamDict);
    })
    return [a, b];
}//getLive

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//function to read historical streams directory and return a list of HTML select options
//for encoders
async function getHist(){
    var a, b;
    await getFiles(streamRoot) //set to /data2/ftps/ on return to VMTAGHLS
    .then((files) => {
        var hstreamDict = {};
	for(i = 0; i < files.length; i++){
	    if(!(files[i].includes('.m3u8'))){
		files.splice(i,1);
		i--;
	    }//if
	}//for
        for(i = 0; i < files.length; i++){
            rawPathElements = files[i].toString().split(/\/|,/g); //set to (/\/|,/g) on return to VMTAGHLS
            key = rawPathElements[rawPathElements.length-2];
            value = rawPathElements[rawPathElements.length-1];
            if(!hstreamDict[key]){
                hstreamDict[key] = [value];
            }//if
            else{
                hstreamDict[key].push(value);
            }//else
        }//for
        return hstreamDict;
    })//then
    .then((streamDict) => {
        var optTransDict = {};
        var keys = Object.keys(streamDict);
        for(i = 0; i < keys.length; i++){
            var opt = keys[i];
            if(translations['opt'].hasOwnProperty(opt)) {
                optTransDict[translations['opt'][opt]] = streamDict[opt];
            }//if
            else{
                optTransDict[opt] = streamDict[opt];
            }//else
        }//for
        return [optTransDict, streamDict];
    })//then
    .then((tuple) => {
        //transDict looks like {opt: ["enc1", "enc2"], opt2: ...}
        var transDict = tuple[0];
        var streamDict = tuple[1];
        var encTransDict = {};
        var keys = Object.keys(transDict);
        var values = Object.values(transDict);
        var encoderTranslations = translations['enc'];

        for(var i = 0; i < values.length; i++){
            for(var j = 0; j < values[i].length; j++){
                var cleanEnc = values[i][j].toString().split("_")
                if(cleanEnc.length > 1){
                    values[i][j] = cleanEnc[0] + "_" + cleanEnc[1].split('.')[0];
                }//if
            }//for
        }//for

        //scan across transDict -- for loop
        for(var i = 0; i < keys.length; i++) {
            var opt = keys[i];
            var arrayCheck = Array.isArray(values[i]) && values[i].length > 1;
            if(arrayCheck) {
                for(var j = 0; j < values[i].length; j++){
                    var isTranslatable = encoderTranslations.hasOwnProperty(values[i][j]);
                    if(isTranslatable){
                        opt in encTransDict ? encTransDict[opt].push(encoderTranslations[values[i][j]]) : encTransDict[opt] = [encoderTranslations[values[i][j]]]; 
                    }//if
                    else{
                        opt in encTransDict ? encTransDict[opt].push(values[i][j]) : encTransDict[opt] = [values[i][j]];
                    }
                }//for
            }//if
            else{
                var isTranslatableNonArray = encoderTranslations.hasOwnProperty(values[i][0]);
                if(isTranslatableNonArray){
                    opt in encTransDict ? encTransDict[opt].push(encoderTranslations[values[i][0]]) : encTransDict[opt] = [encoderTranslations[values[i][0]]];
                }//if
                else{
                    opt in encTransDict ? encTransDict[opt].push(values[i][0]) : encTransDict[opt] = [values[i][0]];
                }
            }//else
        }//for
        return [encTransDict, streamDict];
    })//then
    .then((tuple) => {
        var transDict = tuple[0];
        var streamDict = tuple[1];
        a = populateList(transDict);
        b = populateList(streamDict);
    })
    return [a, b];
}//getHist

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//function to read requested encoder directory and return a list of HTML select options for dates
async function getDates(opt, enc){
    var a;
       // await readDir('./data2/ftps/' + opt + '/' + enc + '/')
    await readDir(streamRoot + opt + '/')
    .then((streamList) => {
        dateStamps = {};
        for(i=0; i < streamList.length; i++){
            val = streamList[i];
            ts = streamList[i].toString().split('_');
            ts = ts[ts.length-1];
            ts = ts.slice(0, -3);
            ts = new Date(Number(ts));
            if(ts != "Invalid Date" && Date.parse(ts) > 1577842579 && !dateStamps[ts.toLocaleDateString()]){
                dateStamps[ts.toLocaleDateString()] = val;
            }//if
        }//for
        a = populateList(dateStamps);
    })//then
    return a;
}//getDates

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//function to read requested encoder and date directory and return a list of HTML select options
//for times
async function getTimes(opt, enc, date){
    formDate = date.toString().split('_');
    formDate = formDate[formDate.length-1];
    formDate = formDate.slice(0, -3);
    formDate = new Date(Number(formDate));
    var a;
    await readDir(streamRoot + opt +  '/')
    .then((streamList) => {
        timeStamps = {};
        for(i=0; i < streamList.length; i++){
            val = streamList[i];
            ts = streamList[i].toString().split('_');
            ts = ts[ts.length-1];
            ts = ts.slice(0, -3);
            ts = new Date(Number(ts));
            if(ts != "Invalid Date" && Date.parse(ts) > 1577842579 && !timeStamps[ts.toLocaleTimeString()] && ts.toLocaleDateString() === formDate.toLocaleDateString()){
                timeStamps[ts.toLocaleTimeString('en-US', {hour12: false, timeZone: 'America/New_York'})] = val;
            }//if
        }//for
        a = populateList(timeStamps);
    })//then
    return a;
}//getTimes

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//function to create list of options from directory listing with values and styles consistent with 
//document (<-- helper function)
function populateList(streamList){
    optionList = [];
    keysList = Object.keys(streamList);
    if(keysList[0] !== '0'){
        for(i = 0; i < keysList.length; i++){
            var option = {
                key : keysList[i],
                value : streamList[keysList[i]]
            };//option
            optionList.push(option);
        }//for
    }//if
    else{
        for(i = 0; i < streamList.length; i++){
            var option = {
                key : streamList[i],
                value : streamList[i]
            };//option
            optionList.push(option);
        }//for
    }//else
    return optionList;
}//populateList

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

async function getLiveEnc(opt, enc){
    var a;
    await exec(`find ${streamRoot}${opt} -name "enc*_*.m3u8" -print | sort -r | head -1`)
    .then((stdout) => {
	a = stdout.stdout.replace(/[\n\r]|\/data2\/ftps/g, "");
    })//then
    return a;
}//getLiveEnc

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

async function getTS(start, end, strm, serv){
    var state;
    var execString = 'cat'; //"cat [] [] ... > [target]" for linux, "copy /b [] + /b [] ... [target]" for windows
    if(strm == '0' && serv == '0'){
        await sleep(10000);
        try{
            fs.unlinkSync(`${depositRoot}${start*1000}_${end*1000}.ts`, (err) => {
                if(err){
                    console.log(err);
                }//if
                else{
                    console.log("File deleted.");
                    return;
                }//else
            })//unlink
        }//try
        catch{
            console.log("Error while deleting file.");
        }
        return;
    }//if
    await getFiles(streamRoot)
    .then((files) => {
        var encoderMatch = [];
        for(var i = 0; i < files.length; i++){
            var rawPathElements = files[i].toString().split(/\/|,/g);
            var encoder = rawPathElements[rawPathElements.length-1]
            if(encoder.includes(strm)){
                encoderMatch.push(encoder);
            }//if
        }//for
        var range = [];
        start = Number(start)*1000;
        end = Number(end)*1000;
        for(var i = 0; i < encoderMatch.length; i++){
            var timeStamp = encoderMatch[i].toString().split('_');
            timeStamp = Number(timeStamp[timeStamp.length-1]);
            var a = start >= timeStamp && start <= (timeStamp + 1.8e9);
            var b = end >= timeStamp && end <= (timeStamp + 1.8e9);
            if(a || b){
                range.push(timeStamp);
            }//if
        }//for
        return range;
    })//then
    .then(async (range) => {
        if(range.length == 1){ //all in one
            var chunk = range[0];
            await readDir(`${streamRoot}${serv}/${strm + "_" + chunk}`)    //change to linux formatting on return to VMTAGHLS
            .then((files) => {
                var tsFiles = [];
                for(var i = 0; i < files.length; i++){
                    if(!(files[i].includes(".m3u8"))){
                        tsFiles.push(files[i]);
                    }//if
                }//for
                var front = Math.floor((start - chunk)/2.3836e6);
                var length = Math.ceil((end - start)/2.3836e6);
                tsFiles = tsFiles.splice(front, length);
                for(var i = 0; i < tsFiles.length; i++){
                    if(i == 0){
                        execString += ` ${streamRoot}${serv}/${strm + "_" + chunk}/${tsFiles[i]}`;
                    }//if
                    else if(i == tsFiles.length-1){
                        execString += ` ${streamRoot}${serv}/${strm + "_" + chunk}/${tsFiles[i]} > ${depositRoot}${start}_${end}.ts`;
                    }//else if
                    else{
                        execString += ` ${streamRoot}${serv}/${strm + "_" + chunk}/${tsFiles[i]}`;
                    }//else
                }//for
            })//then
            .catch((e) => {
                console.log("TS splicing for single-chunk splice failed internally for " + e);
            })//catch
        }//if
        else if(range.length == 2){ //across two
            var chunk1 = range[0];
            var chunk2 = range[1];
            //chunk1
            await readDir(`${streamRoot}${serv}/${strm + "_" + chunk1}`)
            .then((files) => {
                var tsFiles = [];
                for(var i = 0; i < files.length; i++){
                    if(!(files[i].includes(".m3u8"))){
                        tsFiles.push(files[i]);
                    }//if
                }//for
                var length = Math.ceil((chunk2-start)/2.3836e6);
                tsFiles = tsFiles.splice(tsFiles.length - length, length);
                for(var i = 0; i < tsFiles.length; i++){
                    if(i == 0){
                        execString += ` ${streamRoot}${serv}/${strm + "_" + chunk1}/${tsFiles[i]}`;
                    }//if
                    else{
                        execString += ` ${streamRoot}${serv}/${strm + "_" + chunk1}/${tsFiles[i]}`;
                    }//else
                }//for
            })//then
            .catch((e) => {
                console.log("TS splicing for double-chunk failed internally at chunk file for " + e);
            })//catch
            //chunk2
            await readDir(`${streamRoot}${serv}/${strm + "_" + chunk2}`)
            .then((files) => {
                var tsFiles = [];
                for(var i = 0; i < files.length; i++){
                    if(!(files[i].includes(".m3u8"))){
                        tsFiles.push(files[i]);
                    }//if
                }//for
                var length = Math.ceil((end - chunk2)/2.3836e6);
                tsFiles = tsFiles.splice(0, length);
                for(var i = 0; i < tsFiles.length; i++){
                    if(i == tsFiles.length-1){
                        execString += ` ${streamRoot}${serv}/${strm + "_" + chunk2}/${tsFiles[i]} > ${depositRoot}${start}_${end}.ts`;
                    }//if
                    else{
                        execString += ` ${streamRoot}${serv}/${strm + "_" + chunk2}/${tsFiles[i]}`;
                    }//else
                }//for
            })//then
            .catch((e) => {
                console.log("TS splicing for double-chunk failed internally at second chunk for " + e);
            })//catch
        }//elseif
    })//then
    .then(async () => {
        if(execString){
	    console.log(execString);
            await exec(execString)
            .then(() =>{
                state = 'executed';
                console.log('executed');
            })//then
            .catch((e) => {
                state = 'failed';
                console.log('Copy command failed for ' + e);
            })//catch
        }//if
        else{
            state = 'failed';
            console.log('Copy command could not be generated for ' + e);
        }//else
        //return state;
    })//then
    .catch((e) => {
        console.log('Copy command failed to generate or execute for ' + e);
    })//catch
    return state;
}//getTS

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}//sleep

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//exports
exports.populateList = populateList;
exports.getLive = getLive;
exports.getHist = getHist;
exports.getDates = getDates;
exports.getTimes = getTimes;
exports.getLiveEnc = getLiveEnc;
exports.getTS = getTS;
