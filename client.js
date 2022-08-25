//client.js
//functions required by client-side application

//required modules

//globals
var domain = window.location.origin

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------


//function controlling dynamic tab content and behavior of page elements
//when a tab is focused or not
function openPage(pageName,elmnt,color) {
    //pause page video when focused on opposite tab
    if(pageName == 'Live'){
        var video = document.getElementById('historicalVideo');
        video.pause();
        closeEye();
        document.title = "Tag Viewer";
    }//if
    else{
        video = document.getElementById('liveVideo');
        video.pause();
        closeEye();
        document.title = "Tag Viewer";
    }//else
}//openPage

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//function receives list of options, then writes them into the document under optgroups
//according to the relevant HTML element
function makeOptions(optionList, select, rawList = []){
    $( document ).ready(function() {
        parent = document.getElementById(select);
        if(Array.isArray(optionList[0].value) && optionList[0].value.length){
	        for(item in optionList){
                //create optgroup for item
                sel = document.getElementById(select);
                optgroup = document.createElement("optgroup");
                optgroup.label = optionList[item].key;
                if(select == 'liveStreams'){
                    optgroup.id = "live_" + optionList[item].key;
                }//if
                else {
                    optgroup.id = "hist_" + optionList[item].key;
                }//else
                sel.appendChild(optgroup);
                var values = [];
                for(i in optionList[item].value) {
                    option = document.createElement("option");
                    option.text = optionList[item].value[i];
                    if(rawList.length){
                        option.value = rawList[item].value[i];
                    }//if
                    else{
                        option.value = optionList[item].value[i];
                    }//else
                    if(!(values.includes(option.value))){
                        values.push(option.value);
                        optgroup.appendChild(option);
                    }
                }//for
                //create option for each element in value
            }//for
        }//if
	 else{
	    Array.from(optionList).forEach((item) => {
                option = document.createElement("option");
                option.text = item.key;
                option.value = item.value;
                parent.add(option);
            })//elseif
        }//for
        $('.selectpicker').selectpicker('refresh');
    });//ready
}//makeOptions

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//function to retrieve list of encoders available based on either live stream
//or historical stream requests
async function getEncs(select){
    if(select == 'liveStreams'){
        url = domain + '/live_streams'
        side = 'live'
    }//if
    else{
        url = domain + '/hist_streams'
        side = 'historical'
    }//else
    
    var resp = await fetch(url)
    .then((resp) => {
        return Promise.resolve(resp.text())
    })//then
    .then((tuple) => {
        tuple = JSON.parse(tuple);
        var a = tuple[0];
        var b = tuple[1];
        return makeOptions(a, select, b);
    })//then
    .catch((e) => {
        console.log(e);
        alert("Failure while requesting " + side + " encoders.\n" + e)
    })
    $('#startDate').attr('disabled', true);
    $('#endDate').attr('disabled', true);
    $('#historicalDates').attr('disabled', true);
    $('#historicalTimes').attr('disabled', true);
    $('#startTime').attr('disabled', true);
    $('#endTime').attr('disabled', true);
    $('#downloadButton').attr('disabled', true);
}//getEncs

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//function to remove all encoder options
function clearEncs(select){
    var encs = document.getElementById(select);
    var i = 0;
    var q = encs.length;
    while (i <= q){
        encs.remove(encs.length - 1);
        i++;
    }//while
    $('.selectpicker').selectpicker('refresh');
}//clearEncs

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//function to retrieve directory of dates for historical streams
//then calls makeOptions to write those values into the document
function getDates(encoder, optgroup){
    clearDates();
    clearTimes();
    var resp = fetch(domain + `/get_dates?opt=${optgroup}&enc=${encoder}`)
    .then((resp) => {
        return Promise.resolve(resp.text())
    })//then
    .then((a) => {
        a = JSON.parse(a);
        return makeOptions(a, 'historicalDates')
    })//then
    .catch((e) => {
        console.log(e)
        alert("Failure while requesting historical dates.\n" + e)
    })//catch
        
    $('#historicalDates').attr('disabled', false);
    $('#startDate').attr('disabled', false);
    $('#endDate').attr('disabled', false);
    $('#startTime').attr('disabled', false);
    $('#endTime').attr('disabled', false);
    $('#downloadButton').attr('disabled', false);
    $('.selectpicker').selectpicker('refresh');
}//getDates


//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//function to remove date options when a new encoder has been chosen
//prevents user from selecting non-existent streams
function clearDates(){
    var dateOptions = document.getElementById('historicalDates');
    var i = 0;
    var q = dateOptions.length;
    while(i <= q){
        dateOptions.remove(dateOptions.length - 1);
        i++;
    }//while
    $('#historicalDates').attr('disabled', true);
    $('.selectpicker').selectpicker('refresh');
}//clearDates

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//function to retrieve directory of time blocks for historical streams
//then calls makeOptions to write those values into the document
function getTimeBlocks(enc, date, optgroup) {
    clearTimes();
    var resp = fetch(domain + `/get_times?opt=${optgroup}&enc=${enc}&date=${date}`)
    .then((resp) => {
        return Promise.resolve(resp.text())
    })//then
    .then((a) => {
        a = JSON.parse(a);
        return makeOptions(a, 'historicalTimes')
    })//then
    .catch((e) => {
        console.log(e)
        alert("Failure while requesting historical times.\n" + e)
    })//catch

    $('#historicalTimes').attr('disabled', false);
    $('.selectpicker').selectpicker('refresh');

}//getTimeBlocks

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//function to remove time options when a new encoder or date has been chosen
//prevents user from selecting non-existent streams
function clearTimes(){
    var timeOptions = document.getElementById('historicalTimes');
    var i = 0;
    var q = timeOptions.length;
    while(i <= q){
        timeOptions.remove(timeOptions.length - 1);
        i++;
    }//while
    $('#historicalTimes').attr('disabled', true);
    $('.selectpicker').selectpicker('refresh');
}//clearTimes

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

async function getLiveEnc(server, enc){
     var filename;
     var resp = await fetch(domain + `/live_enc?srv=${server}&enc=${enc}`)
    .then((resp) => {
        return Promise.resolve(resp.text())
    })//then
    .then((a) => {
        filename = a;
    })//then
    .catch((e) => {
        console.log(e)
        alert("Failure while locating live encoder. \n" + e)
    })//catch

    /*if (filename ==1){
        alert("Failure - no m3u8 file detected for " + enc + ".")
    }//if
    else if (filename == 2) {
        alert("Failure - too many m3u8 files detected for " + enc + ".")
    }//else if
    else{
        return filename;
    }//else*/
    return filename;
}//getLiveEnc

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//function to load and play selected video on <video> elements through HLS, and update titles accordingly
async function playVideo(mrl, select){
    var optgroup = $(select).find(":selected").parent().attr('label');
    if (Hls.isSupported()){
        if(select.id == 'historicalStreams'){
            var video = document.getElementById('historicalVideo');
            mrl = mrl + '.m3u8';
        }//if
        else{
            var video = document.getElementById('liveVideo');
            mrl = '.' + await getLiveEnc(optgroup, mrl)
            .then((a) => {
                a = a.split('"').join('');
                return a;
            });//then
        }//else
        var hls = new Hls();
        //bind them together
        hls.attachMedia(video);
        //MEDIA_ATTACHED event is fired by hls object once MediaSource is ready
        hls.on(Hls.Events.MEDIA_ATTACHED, function() {
            addLog(select, select.value + " and hls.js are now bound together !");
            hls.loadSource(mrl);
            //MANIFEST_PARSED is expected to be fired by this^ line
            hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
                addLog(select, "manifest loaded, found " + data.levels.length + " quality level");
            });//hls.on
            video.play();
            document.title = $('#historicalStreams option:selected').text();
        })//hls.on
    }//if
}//playVideo

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//function to change the page favicon to the open-eye image (used on video.play())
function openEye(){
    var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/svg';
    link.rel = 'icon';
    link.href = 'images/eye.svg';
    document.getElementsByTagName('head')[0].appendChild(link);
}//openEye

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//function to change the page favicon to the closed-eye image (used on video.pause(), page change)
function closeEye(){
    var link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/svg';
    link.rel = 'icon';
    link.href = 'images/eye-closed.svg';
    document.getElementsByTagName('head')[0].appendChild(link);
}//closeEye

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

async function downloadTS(){

    var hour = new Date(3.6e6);
    var startDate = $('#startDate').val().split('/');
    var startTime = $('#startTime').val().split(':');
    var start = new Date(Number(startDate[2]), Number(startDate[0])-1, Number(startDate[1]), Number(startTime[0]), Number(startTime[1]), Number(startTime[2]));//subtracting an hour to account for timezones
    start = new Date(start - hour);

    var endDate = $('#endDate').val().split('/');
    var endTime = $('#endTime').val().split(':');
    var end = new Date(Number(endDate[2]), Number(endDate[0])-1, Number(endDate[1]), Number(endTime[0]), Number(endTime[1]), Number(endTime[2]));//subtracting an hour to account for timezones
    end = new Date(end - hour);

    var dateDiff = end - start;

    if(end > start){
        if(dateDiff <= 600000 && dateDiff > 1000){
            var resp = await fetch(domain + `/dl?start=${start.getTime()}&end=${end.getTime()}&strm=${$('#historicalStreams option:selected').val()}&serv=${$('#historicalStreams').find('option:selected').parent().attr('label')}`)
            .then((a) => {
                return Promise.resolve(a.text());
            })
            .then((a) => {
                a = a.replace(/['"]+/g, '');
                if(a == 'executed'){
                    var iframe = document.createElement('iframe');
                    iframe.style = "display:none;";
                    iframe.src = `${start.getTime() * 1000}_${end.getTime() * 1000}.ts`
                    setTimeout(document.body.appendChild(iframe), 1000);

                }//if
                else{
                    alert('Failure while creating TS file. \n');
                }
            })
            .then(() => {
                fetch(domain + `/dl?start=${start.getTime()}&end=${end.getTime()}&strm=0&serv=0`);
            })
            .catch((e) => {
                console.log(e);
                alert('Failure while requesting TS file download. \n' + e);
            })
        }//if
        else if(dateDiff > 60000){
            alert("The requested file is too large. Length must be shorter than 1 minute.");
        }//else if
        else if(dateDiff <= 1000){
            alert("The requested file is too small. Length must be greater than 1 second.");
        }
    }//if
    else{
        alert("Start timestamp must be before end timestamp.");
    }//else
    
    /*if(startDate < endDate && startDate >= minDate && startDate < maxDate && endDate > minDate && endDate <= maxDate){
        var resp = await fetch(domain + `/dl?start=${startDate}&end=${endDate}&strm=${$('#historicalTimes option:selected').val()}`)
        .then((resp) => {
            Promise.resolve(resp.text);
        })
        //.then((a) => {
          //  download(a, $('#historicalTimes option:selected').val(), 'video/mp2t');
        //})
        .catch((e) => {
            console.log(e);
            alert('Failure while requesting TS file download. \n' + e);
        });
    }//if
    else{
        alert("Invalid time range.")
    } */

}

//-------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------

//function to add data to the logbox in column 3, including timestamps
function addLog(select, msg){
    if(select.id == 'liveStreams'){
        var well = document.getElementById('liveWell');
    }//if
    else{
        var well = document.getElementById('historicalWell');
    }//else
    var timestamp =  new Date(Date.now());
    msg = "> " + timestamp.toLocaleTimeString() + ": " + msg;
    var log = document.createElement('p');
    //console.log(msg);
    log.class = "logfade";
    log.innerHTML = msg;
    log.style = "color: #00264c";
    well.appendChild(log);
}//addLog
