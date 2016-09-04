namespace SignalR4SimpleWebRtc.Hubs
{
	public class SimpleWebRtcMessage
	{
		public string To { get; set; }
		public string From { get; set; }
		public string Sid { get; set; }
		public string Broadcaster { get; set; }
		public string RoomType { get; set; }
		public string Type { get; set; }
		public RtcPayload Payload { get; set; }
		public string Prefix { get; set; }
	}

	public class RtcPayload
	{
		public string Sdp { get; set; }
		public string Type { get; set; }
		public RtcCandidate Candidate { get; set; }
	}

	public class RtcCandidate
	{
		public string Candidate { get; set; }
		public int SdpMLineIndex { get; set; }
		public string SdpMid { get; set; }
	}
}