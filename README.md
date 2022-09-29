# TAGViewer
##### A Node.js web application for viewing and downloading live and historical linear video streams

## Background
The IP multiviewer system ("TAG") compounds hundreds of in-house video and audio signals into composite feeds. It is desirable for transmission and error monitoring to view these composite feeds live as well as recall historical sections by time. In certain cases, it is also desirable to download these feeds for reference in other systems. I built the TAGViewer to satisfy these needs.

I configured the multiviewer servers to output live HLS files of their composite feeds to an Ubuntu FTP server. The HLS files (.ts) are automatically organized into their own directories of 30-minute chunks with an associated playlist file (.m3u8).

The front-end is a Bootstrap UX. The back-end is a Node.js application on a Express.js web server that utilizes HLS.js for streaming functionality and NGINX for serving larger files. The front-end and back-end communicate using a set of custom APIs in app.js.

## Live Streams
![](https://github.com/morgsimmons95/TAGViewer/blob/main/TV_live.gif)

When selecting a stream from the Live Streams tab, the Node.js web server serves the latest playlist file for that specific stream. When the 30-minute chunk rolls over and a new chunk begins, the next playlist file is served seamlessly. The streams are organized into opt-groups in the front-end dropdown by the name of the multiviewer server that generates the original HLS stream. Because the HLS streams are an auxiliary function of the multiviewer system (the primary function being SMPTE-2110 outputs), there is a delay introduced by the multiviewer servers and the FTP server of around 10 seconds total.

## Historical Streams
![](https://github.com/morgsimmons95/TAGViewer/blob/main/TV_historical.gif)

The Historical Streams tab has dropdowns to select a 30-minute chunk from every stream and a section to specify a time range for download. When streaming a historical feed, the Node.js server filters the streams by encoder name and checks the requested time range against the chunk directories, which are organized by Unix time. It then serves the appropriate playlist file. A user can seek through the full length of the chunk - this is in contrast with the live streaming function, which only allows seeking for content that has already played out 😁. 

## Stream Downloading

![](https://github.com/morgsimmons95/TAGViewer/blob/main/TV_download.gif)

The download function is housed on the Historical Streams tab. A calendar widget assists with choosing valid dates (the FTP server only stores the multiviewer streams for 7 days). Once a desired time window is entered, the server chooses the specified .ts files by converting the start of the window to the Unix time and dividing the length of the window by the size of each .ts file (approximately 2.36 seconds) - this returns the index of the starting .ts file and the number of subsequent files. The server differentiates this process when the window spans two chunks versus when the window resides in a single chunk. Once the starting file and subsequent files are determined, the server combines them (Unix cat [source] > [target] command) and serves the resulting .ts file for download. The server can handle downloads of up to 10 minutes.
