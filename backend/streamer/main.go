package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"net"

	"github.com/pion/webrtc/v3"
)



type event struct{
	Event string  `json:"event"`
	Data map[string]interface{}
}




func main() {

	conn, err := net.Dial("tcp", "127.0.0.1:9000")

	if err != nil{
		panic(err)
	}
	defer conn.Close()




	config := webrtc.Configuration{
		ICEServers: []webrtc.ICEServer{
			{
				URLs: []string{"stun:stun.l.google.com:19302"},
			},
		},
	}



	peerConnection, err := webrtc.NewPeerConnection(config)
	if err != nil {
		panic(err)
	}

	peerConnection.OnICEConnectionStateChange(func(connectionState webrtc.ICEConnectionState) {

		data := make(map[string]interface{})

		data["candidate"] = connectionState.String()

		event := event{Event: "ice-candidate", Data: data}

		str, _ := json.Marshal(event)

		conn.Write([]byte(str))
	})


	opusTrack, err := webrtc.NewTrackLocalStaticSample(webrtc.RTPCodecCapability{MimeType: "audio/opus"}, "audio", "pion1")
	if err != nil {
		panic(err)
	} else if _, err = peerConnection.AddTrack(opusTrack); err != nil {
		panic(err)
	}


	vp8Track, err := webrtc.NewTrackLocalStaticSample(webrtc.RTPCodecCapability{MimeType: "video/vp8"}, "video", "pion2")
	if err != nil {
		panic(err)
	} else if _, err = peerConnection.AddTrack(vp8Track); err != nil {
		panic(err)
	}


	for { 
	  message, _ := bufio.NewReader(conn).ReadString('\n')
	  
	  var res event

	  err := json.Unmarshal([]byte(message), &res)


	  if err != nil{
		  panic(err)
	  }

	  fmt.Println(res.Event)

	  switch res.Event{
		case "start-webrtc": {

			offer, err := peerConnection.CreateOffer(nil)
			
			if err != nil {
				panic(err)
			}

			gatherComplete := webrtc.GatheringCompletePromise(peerConnection)


			if err = peerConnection.SetLocalDescription(offer); err != nil {
				panic(err)
			}

			<-gatherComplete

			


			conn.Write([]byte(peerConnection.LocalDescription().SDP))

		}
	  }





	}

}
