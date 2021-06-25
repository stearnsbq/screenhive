package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"net"

	"github.com/pion/webrtc/v3"
	gst "screenhive.io/streamer/include/gstreamer-src"
)



type event struct{
	Event string  `json:"event"`
	Data map[string]interface{} `json:"data"`
}



var peers = make(map[string]webrtc.PeerConnection)



func main() {

	var socketMutex = &sync.Mutex{}

	gst_video_pipline_str := "autovideosrc ! video/x-raw, width=320, height=240 ! videoconvert ! queue"
	gst_audio_pipline_str := "audiotestsrc"

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

	opusTrack, err := webrtc.NewTrackLocalStaticSample(webrtc.RTPCodecCapability{MimeType: "audio/opus"}, "audio", "pion1")

	if err != nil {
		panic(err)
	} 

	vp8Track, err := webrtc.NewTrackLocalStaticSample(webrtc.RTPCodecCapability{MimeType: "video/vp8"}, "video", "pion2")

	if err != nil {
		panic(err)
	} 

	gst.CreatePipeline("opus", []*webrtc.TrackLocalStaticSample{opusTrack}, gst_audio_pipline_str).Start()
	gst.CreatePipeline("vp8", []*webrtc.TrackLocalStaticSample{vp8Track}, gst_video_pipline_str).Start()

	createPeerConnection := func () *webrtc.PeerConnection{

		peerConnection, err := webrtc.NewPeerConnection(config)

		if err != nil {
			panic(err)
		}

		peerConnection.OnICEConnectionStateChange(func(connectionState webrtc.ICEConnectionState) {
			fmt.Printf("Connection State has changed %s \n", connectionState.String())
		})

		if _, err = peerConnection.AddTrack(opusTrack); err != nil {
			panic(err)
		}

		if _, err = peerConnection.AddTrack(vp8Track); err != nil {
			panic(err)
		}
		
		offer, err := peerConnection.CreateOffer(nil)

		if err != nil {
			panic(err)
		}

		if err = peerConnection.SetLocalDescription(offer); err != nil {
			panic(err)
		}

		return peerConnection
	}

	for { 
	  message, _ := bufio.NewReader(conn).ReadString('\n')

	  
	  var res event

	  err := json.Unmarshal([]byte(message), &res)


	  if err != nil{
		  panic(err)
	  }


	  switch res.Event{
		case "start-webrtc": {

			video_offer := event{}

			dataMap := make(map[string]interface{})

			video_offer.Event = "video-offer"

			for _, user := range res.Data["peers"].([]interface{}){

				peerConnection := createPeerConnection()

				peerConnection.OnICECandidate(func(i *webrtc.ICECandidate) {

					if i != nil{

						evt := event{}
		
						data := make(map[string]interface{})
			
						data["candidate"] = i.ToJSON()
						data["peer"] = user
			
						evt.Event = "streamer-ice-candidate"
						evt.Data = data
			
						candidate, _ := json.Marshal(evt);
			
						socketMutex.Lock()
			
						conn.Write(candidate)
			
						time.Sleep(time.Millisecond)
			
						socketMutex.Unlock()
					}


		
				})

				if _, exists := dataMap["sdp"]; !exists {
					dataMap["sdp"] = peerConnection.LocalDescription();
				}
				
				peers[user.(string)] = *peerConnection;

			}

			video_offer.Data = dataMap;

			jsonData, _ := json.Marshal(video_offer)

			
			conn.Write(jsonData)
			break
		}

		case "user-join-room":{

			user := res.Data["peer"].(string)

			peerConnection := createPeerConnection()

			peers[user] = *peerConnection

			conn.Write([]byte(peerConnection.LocalDescription().SDP))
			break
		}
		case "user-left-room":{

			user := res.Data["user"].(string)

			peerConnection := peers[user];

			peerConnection.Close()

			delete(peers, user)

			break
		}
		case "video-answer":{
			
			peer := res.Data["peer"].(string)
			sdp := res.Data["sdp"].(map[string]interface{})
			

			sessionDesc := webrtc.SessionDescription{SDP: sdp["sdp"].(string), Type: webrtc.NewSDPType(sdp["type"].(string)) }

			peerConnection := peers[peer]

			peerConnection.SetRemoteDescription(sessionDesc)

			break
		}
		case "user-ice-candidate":{


			if res.Data["candidate"] != nil{

				peer := res.Data["peer"].(string)
				candidate := res.Data["candidate"].(map[string]interface {})

				peerConnection := peers[peer]

				Candidate := candidate["candidate"].(string)
				SDPMLineIndex, _ := candidate["sdpMLineIndex"].(float64)
				SDPMid := candidate["sdpMid"].(string)
	
				SDPMLineIndexPtr := uint16(SDPMLineIndex)
	
				iceCandidate := webrtc.ICECandidateInit{Candidate: Candidate, SDPMLineIndex: &SDPMLineIndexPtr , SDPMid: &SDPMid, UsernameFragment: &peer }
	
				peerConnection.AddICECandidate(iceCandidate)

			}

	


			break
		}
	  }





	}

}
