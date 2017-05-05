using System.Collections.Generic;

namespace SignalR4SimpleWebRtc.Hubs
{
	public class SimpleWebRtcRoomClients
	{
		public Dictionary<string, SimpleWebRtcClientResources> Clients { get; set; }
	}
}