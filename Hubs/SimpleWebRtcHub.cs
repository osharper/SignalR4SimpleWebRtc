using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using Microsoft.AspNet.SignalR;
using Newtonsoft.Json;

namespace SignalR4SimpleWebRtc.Hubs
{
	/*
		Remake of https://github.com/andyet/signalmaster/blob/master/sockets.js in SignalR terms
	*/
	public class SimpleWebRtcHub : Hub<ISimpleWebRtcClient>
	{
		public static readonly Dictionary<string, List<string>> RoomsConnectionsDictionary = new Dictionary<string, List<string>>();

		private static XirsysServer[] _iceServers;

		// ▬▬ Handle Clients Connecting/Disconnecting ▬▬
		/* 
		   We can have already established connection to SignalR
		   so we need Init method at the beginnig of interaction with this hub instead of OnConnected
		*/
		public override async Task OnConnected()
		{
			// Only for socket.io compatibility
			Clients.Caller.Connect();

			await SendIceServers();
		}

		public override async Task OnDisconnected(bool stopCalled)
		{
			var roomIds = RoomsConnectionsDictionary
					// Select rooms with client ConnectionId
					.Where(kvp => kvp.Value.Any(c => c == Context.ConnectionId))
					.Select(kvp => kvp.Key).ToArray();

			foreach (var roomId in roomIds)
			{
				Leave(roomId);
			}

			await base.OnDisconnected(stopCalled);
		}

		// ▬▬ Methods for clients ▬▬
		public virtual string Create(string roomId)
		{
			var hasRoom = RoomsConnectionsDictionary.ContainsKey(roomId);
			if (hasRoom) throw new ApplicationException("Room already exists on the server");

			RoomsConnectionsDictionary.Add(roomId, new List<string>());

			return roomId;
		}


		public virtual Task<SimpleWebRtcRoomClients> Join(string roomId)
		{
			List<string> roomConnections;
			var hasGroupConnectionsList = RoomsConnectionsDictionary.TryGetValue(roomId, out roomConnections);
			if (!hasGroupConnectionsList)
			{
				roomConnections = new List<string>();
				RoomsConnectionsDictionary.Add(roomId, roomConnections);
			}
			
			// ReSharper disable once SimplifyLinqExpression
			if (!roomConnections.Any(c => c == Context.ConnectionId))
				roomConnections.Add(Context.ConnectionId);

			var roomClients = roomConnections.Where(c => c != Context.ConnectionId)
											 .ToDictionary(c => c, c => SimpleWebRtcClientResources.Default);

			return Task.FromResult(new SimpleWebRtcRoomClients { Clients = roomClients });
		}

		// Because SignalR don't like methods with default parameters value
		public void Leave()
		{
			Leave(null);
		}

		public void Leave(string roomId)
		{
			var roomsWithConnection = RoomsConnectionsDictionary
									  // Select rooms with client ConncetionId
									  .Where(kvp => kvp.Value.Any(c => c == Context.ConnectionId) &&
													(roomId == null || roomId == kvp.Key))
									  .Select(kvp => kvp).ToArray();

			foreach (var room in roomsWithConnection)
			{
				// Send to all clients in the rooms from which the current client is removed
				room.Value.ForEach(connectionId =>
				{
					Clients.Client(connectionId).RemovePeer(new RemoveClientMessage { Id = Context.ConnectionId });
				});
				room.Value.Remove(Context.ConnectionId);

				if (room.Value.Count == 0) RoomsConnectionsDictionary.Remove(room.Key);
			}
		}

		public void Message(SimpleWebRtcMessage message)
		{
			var otherClient = Clients.Client(message.To);
			if (otherClient == null) return;

			message.From = Context.ConnectionId;
			otherClient.Message(message);
		}
		
		private async Task SendIceServers()
		{
			if (_iceServers != null)
			{
				Clients.Caller.Stunservers(_iceServers);
				return;
			}

			var queryDict = ConfigurationManager.AppSettings.AllKeys
				.Where(key => key.StartsWith("xirsys:"))
				.ToDictionary(k => k.Replace("xirsys:", ""), k => ConfigurationManager.AppSettings[k]);

			if (queryDict.Keys.Count == 0)
			{
				// No Xirsys config
				return;
			}

			var queryString = string.Join("&", queryDict.Select(kvp => $"{kvp.Key}={kvp.Value}").ToArray());
			var xirsysUrl = "https://service.xirsys.com/ice" + "?" + queryString;
			try
			{
				var req = WebRequest.Create(xirsysUrl);

				var response = await req.GetResponseAsync();

				using (var stream = response.GetResponseStream())
				using (var reader = new StreamReader(stream))
				{
					var responseBody = reader.ReadToEnd();
					var jsonResponse = JsonConvert.DeserializeObject<XirsysResponse>(responseBody);

					var servers = jsonResponse?.D?.IceServers;

					if (servers == null || servers.Length == 0)
					{
						return;
					}

					_iceServers = servers;

					Clients.Caller.Stunservers(_iceServers);
				}
			}
			catch (WebException ex)
			{
				Console.WriteLine(ex.Message);
			}
		}

	}
}
