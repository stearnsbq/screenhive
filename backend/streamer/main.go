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

type event struct {
	Event string                 `json:"event"`
	Data  map[string]interface{} `json:"data"`
}

type peer struct {
	Connection *webrtc.PeerConnection
	AudioPipline *gst.Pipeline
	VideoPipeline *gst.Pipeline
}

var peers = make(map[string]peer)

func main() {

	var socketMutex = &sync.Mutex{}

	gst_video_pipline_str := "videotestsrc ! videoconvert ! queue"
	gst_audio_pipline_str := "audiotestsrc"

	conn, err := net.Dial("tcp", "127.0.0.1:9000")

	if err != nil {
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



	createPeerConnection := func() peer {

		peerConnection, err := webrtc.NewPeerConnection(config)

		if err != nil {
			panic(err)
		}

		peerConnection.OnICEConnectionStateChange(func(connectionState webrtc.ICEConnectionState) {
			fmt.Printf("Connection State has changed %s \n", connectionState.String())
		})

		opusTrack, err := webrtc.NewTrackLocalStaticSample(webrtc.RTPCodecCapability{MimeType: "audio/opus"}, "audio", "pion1")

		if err != nil {
			panic(err)
		}
	
		vp8Track, err := webrtc.NewTrackLocalStaticSample(webrtc.RTPCodecCapability{MimeType: "video/vp8"}, "video", "pion2")
	
		if err != nil {
			panic(err)
		}
	

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


		
		peer := peer{}

		peer.Connection = peerConnection
		peer.AudioPipline = gst.CreatePipeline("opus", []*webrtc.TrackLocalStaticSample{opusTrack}, gst_audio_pipline_str)
		peer.VideoPipeline = gst.CreatePipeline("vp8", []*webrtc.TrackLocalStaticSample{vp8Track}, gst_video_pipline_str)


		return peer

	}

	for {
		message, _ := bufio.NewReader(conn).ReadString('\n')

		fmt.Println(message)

		var res event

		err := json.Unmarshal([]byte(message), &res)

		if err != nil {
			panic(err)
		}

		switch res.Event {
		case "start-webrtc":
			{

				video_offer := event{}

				dataMap := make(map[string]interface{})

				video_offer.Event = "video-offer"

				for _, user := range res.Data["peers"].([]interface{}) {


					peer := createPeerConnection()

					peer.Connection.OnICECandidate(func(i *webrtc.ICECandidate) {

						if i != nil {

							evt := event{}

							data := make(map[string]interface{})

							data["candidate"] = i.ToJSON()
							data["peer"] = user

							evt.Event = "streamer-ice-candidate"
							evt.Data = data

							candidate, _ := json.Marshal(evt)

							socketMutex.Lock()

							conn.Write(candidate)

							time.Sleep(time.Millisecond)

							socketMutex.Unlock()
						}

					})

					if _, exists := dataMap["sdp"]; !exists {
						dataMap["sdp"] = peer.Connection.LocalDescription()
					}

					peers[user.(string)] = peer


				}

				video_offer.Data = dataMap

				jsonData, _ := json.Marshal(video_offer)

				conn.Write(jsonData)
				break
			}

		case "user-join-room":
			{

				peerID := res.Data["peer"].(string)


				peer := createPeerConnection()

				peers[peerID] = peer

				evt := event{}

				data := make(map[string]interface{})

			
				data["peer"] = peerID
				data["sdp"] = peer.Connection.LocalDescription()

				evt.Event = "video-offer"
				evt.Data = data;

				serialized, _ := json.Marshal(evt)

				conn.Write(serialized)
				break
			}
		case "user-left-room":
			{

				peerID := res.Data["peer"].(string)

				peer := peers[peerID]

				peer.Connection.Close()

				peer.VideoPipeline.Stop()

				peer.AudioPipline.Stop()

				delete(peers, peerID)

				break
			}
		case "video-answer":
			{

				peerID := res.Data["peer"].(string)
				sdp := res.Data["sdp"].(map[string]interface{})

				sessionDesc := webrtc.SessionDescription{SDP: sdp["sdp"].(string), Type: webrtc.NewSDPType(sdp["type"].(string))}

				peer := peers[peerID]

				peer.Connection.SetRemoteDescription(sessionDesc)

				peer.AudioPipline.Start()
				peer.VideoPipeline.Start()

				break
			}
		case "user-ice-candidate":
			{

				if res.Data["candidate"] != nil {

					peerID := res.Data["peer"].(string)
					candidate := res.Data["candidate"].(map[string]interface{})

					peer := peers[peerID]

					Candidate := candidate["candidate"].(string)
					SDPMLineIndex, _ := candidate["sdpMLineIndex"].(float64)
					SDPMid := candidate["sdpMid"].(string)

					SDPMLineIndexPtr := uint16(SDPMLineIndex)

					iceCandidate := webrtc.ICECandidateInit{Candidate: Candidate, SDPMLineIndex: &SDPMLineIndexPtr, SDPMid: &SDPMid, UsernameFragment: &peerID}

					peer.Connection.AddICECandidate(iceCandidate)
					
				}

				break
			}

		}

	}

}
