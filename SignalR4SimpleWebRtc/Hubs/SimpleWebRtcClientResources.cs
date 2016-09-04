namespace SignalR4SimpleWebRtc.Hubs
{
	public class SimpleWebRtcClientResources
	{
		public bool Screen { get; set; }
		public bool Video { get; set; }
		public bool Audio { get; set; }

		public static SimpleWebRtcClientResources Default
			=> new SimpleWebRtcClientResources { Screen = false, Video = false, Audio = true };
	}
}