using System.Web;
using System.Web.Mvc;

namespace SignalR4SimpleWebRtc
{
	public class FilterConfig
	{
		public static void RegisterGlobalFilters(GlobalFilterCollection filters)
		{
			filters.Add(new HandleErrorAttribute());
		}
	}
}
