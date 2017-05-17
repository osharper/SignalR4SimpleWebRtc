namespace SignalR4SimpleWebRtc.Hubs
{
	public class XirsysResponse
	{
		public int S { get; set; }
		public string P { get; set; }
		public string E { get; set; }
		public XirsysResponseData D { get; set; }
	}

	public class XirsysResponseData
	{
		public XirsysServer[] IceServers { get; set; }
	}

	public class XirsysServer
	{
		public string Url { get; set; }
		public string Credential { get; set; }
		public string Username { get; set; }

		public bool IsStun => Url.StartsWith("stun:");
	}
}