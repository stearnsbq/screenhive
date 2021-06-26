package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"log"
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
	Connection    *webrtc.PeerConnection
	AudioPipline  *gst.Pipeline
	VideoPipeline *gst.Pipeline
	DataChannel   *webrtc.DataChannel
}

var config = webrtc.Configuration{
	ICEServers: []webrtc.ICEServer{
		{
			URLs: []string{"stun:stun.l.google.com:19302"},
		},
	},
}

var gst_video_pipline_str = "videotestsrc ! videoconvert ! queue"
var gst_audio_pipline_str = "audiotestsrc"

var peers = make(map[string]*peer)

func main() {

	var socketMutex = &sync.Mutex{}

	conn, err := net.Dial("tcp", "127.0.0.1:9000")

	if err != nil {
		fmt.Println("Failed to connect to adapter!")
		panic(err)
	}

	defer conn.Close()

	for {
		message, _ := bufio.NewReader(conn).ReadString('\n')

		var res event

		err := json.Unmarshal([]byte(message), &res)

		if err != nil {
			fmt.Println("Failed to parse message from adapter!")
			panic(err)
		}

		switch res.Event {

			case "start-webrtc":
				{

					dataMap := make(map[string]interface{})

					for _, user := range res.Data["peers"].([]interface{}) {

						peer, err := createPeerConnection()

						if err != nil{

							errorMap := make(map[string]interface{})

							errorMap["err"] = err

							evt := createEvent("error", errorMap)

							serialized, _ := json.Marshal(evt)

							conn.Write(serialized)

							continue
						}

						peer.Connection.OnICECandidate(func(i *webrtc.ICECandidate) {

							if i != nil {

								data := make(map[string]interface{})

								data["candidate"] = i.ToJSON()
								data["peer"] = user

								evt := createEvent("streamer-ice-candidate", data)

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

					serialized, _ := json.Marshal(createEvent("video-offer", dataMap))

					conn.Write(serialized)
					break
				}

			case "user-join-room":
				{
					serialized, err := onUserJoinRoom(res.Data["peer"].(string));

					if err != nil{
						errorMap := make(map[string]interface{})

						errorMap["err"] = err

						evt := createEvent("error", errorMap)

						serialized, _ := json.Marshal(evt)

						conn.Write(serialized)
						return
					}

					conn.Write(serialized)
					break
				}
			case "user-left-room":
				{
					onUserLeftRoom(res.Data["peer"].(string))
					break
				}
			case "video-answer":
				{
					onVideoAnswer(res.Data["peer"].(string), res.Data["sdp"].(map[string]interface{}))
					break
				}
			case "user-ice-candidate":
				{
					candidate := res.Data["candidate"]

					if candidate != nil {
						onUserIceCandidate(res.Data["peer"].(string), candidate.(map[string]interface{}))
					}

					break
				}
			default:
				{
					errorMap := make(map[string]interface{})

					errorMap["err"] = "Unknown Event!"

					err := createEvent("error", errorMap)

					serialized, _ := json.Marshal(err);

					conn.Write(serialized)
				}
		}

	}

}

func createEvent(eventType string, data map[string]interface{}) event {
	return event{Event: eventType, Data: data}
}

func createPeerConnection() (*peer, error) {

	peerConnection, err := webrtc.NewPeerConnection(config)

	if err != nil {
		log.Println("Failed to create peer connection!")
		return nil, err
	}

	peerConnection.OnICEConnectionStateChange(func(connectionState webrtc.ICEConnectionState) {
		log.Printf("Connection State has changed %s \n", connectionState.String())
	})

	opusTrack, err := webrtc.NewTrackLocalStaticSample(webrtc.RTPCodecCapability{MimeType: "audio/opus"}, "audio", "pion1")

	if err != nil {
		log.Println("Failed to create audio track!")
		return nil, err
	}

	vp8Track, err := webrtc.NewTrackLocalStaticSample(webrtc.RTPCodecCapability{MimeType: "video/vp8"}, "video", "pion2")

	if err != nil {
		log.Println("Failed to create video track!")
		return nil, err
	}

	if _, err = peerConnection.AddTrack(opusTrack); err != nil {
		log.Println("Failed to add audio track to the peer connection!")
		return nil, err
	}

	if _, err = peerConnection.AddTrack(vp8Track); err != nil {
		log.Println("Failed to add video track to the peer connection!")
		return nil, err
	}

	offer, err := peerConnection.CreateOffer(nil)

	if err != nil {
		log.Println("Failed to create offer!")
		return nil, err
	}

	if err = peerConnection.SetLocalDescription(offer); err != nil {
		log.Println("Failed to set local session description!")
		return nil, err
	}

	dataChannel, err := peerConnection.CreateDataChannel("remote", nil)

	if err != nil {
		log.Println("Failed to create data channel")
		return nil, err
	}

	return &peer{DataChannel: dataChannel, Connection: peerConnection, AudioPipline: gst.CreatePipeline("opus", []*webrtc.TrackLocalStaticSample{opusTrack}, gst_audio_pipline_str), VideoPipeline: gst.CreatePipeline("vp8", []*webrtc.TrackLocalStaticSample{vp8Track}, gst_video_pipline_str)}, nil
}

func onUserLeftRoom(peerID string) {
	peer := peers[peerID]

	peer.DataChannel.Close()

	peer.Connection.Close()

	peer.VideoPipeline.Stop()

	peer.AudioPipline.Stop()

	delete(peers, peerID)
}

func onVideoAnswer(peerID string, sdp map[string]interface{}) {
	sessionDesc := webrtc.SessionDescription{SDP: sdp["sdp"].(string), Type: webrtc.NewSDPType(sdp["type"].(string))}

	peer := peers[peerID]

	peer.Connection.SetRemoteDescription(sessionDesc)

	peer.AudioPipline.Start()
	peer.VideoPipeline.Start()
}

func onUserIceCandidate(peerID string, candidate map[string]interface{}) {
	peer := peers[peerID]

	Candidate := candidate["candidate"].(string)
	SDPMLineIndex := candidate["sdpMLineIndex"].(uint16)
	SDPMid := candidate["sdpMid"].(string)

	iceCandidate := webrtc.ICECandidateInit{Candidate: Candidate, SDPMLineIndex: &SDPMLineIndex, SDPMid: &SDPMid, UsernameFragment: &peerID}

	peer.Connection.AddICECandidate(iceCandidate)
}

func onUserJoinRoom(peerID string) ([]byte, error) {
	peer, err := createPeerConnection()

	if err != nil{
		return nil, err
	}

	peers[peerID] = peer

	data := make(map[string]interface{})

	data["peer"] = peerID
	data["sdp"] = peer.Connection.LocalDescription()

	serialized, _ := json.Marshal(event{Event: "video-offer", Data: data})
	return serialized, nil
}
