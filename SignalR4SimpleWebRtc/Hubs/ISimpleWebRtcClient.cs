namespace SignalR4SimpleWebRtc.Hubs
{
	public interface ISimpleWebRtcClient
	{
		void Connect();
		void Stunservers(XirsysServer[] servers);
		void Message(SimpleWebRtcMessage message);
		void RemovePeer(RemoveClientMessage message);
	}
}