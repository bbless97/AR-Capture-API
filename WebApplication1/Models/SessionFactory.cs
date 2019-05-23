using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ARCaptureAPI.Models
{
    public class SessionFactory
    {
        private Dictionary<Guid, SessionModel> _sessions = new Dictionary<Guid, SessionModel>();

        public SessionFactory()
        {

        }

        /// <summary>
        /// start new session instance store in session factory
        /// </summary>
        /// <returns></returns>
        public SessionModel StartSession()
        {
            cleanupSessions();

            SessionModel returnSession = new SessionModel();
            returnSession.ID = Guid.NewGuid();
            returnSession.Timestamp = DateTime.UtcNow;
            returnSession.State = SessionState.New;

            _sessions.Add(returnSession.ID, returnSession);

            return returnSession;
        }

        /// <summary>
        /// get reference to active session
        /// </summary>
        /// <param name="id">id of session stored</param>
        /// <returns>return refrence to session if found in session factory else return null</returns>
        public SessionModel GetSession(Guid id)
        {
            SessionModel returnSession = null;
            _sessions.TryGetValue(id, out returnSession);

            return returnSession;
        }

        /// <summary>
        /// remove session from session factory
        /// </summary>
        /// <param name="id">id of session to remove</param>
        public void RemoveSession(Guid id)
        {
            _sessions.Remove(id);
        }

        private void cleanupSessions()
        {
            Stack<SessionModel> expiredSessions = new Stack<SessionModel>();

            foreach(SessionModel sessionModel in _sessions.Values)
            {
                if(sessionModel.State == SessionState.Ended || (DateTime.UtcNow - sessionModel.Timestamp).Minutes >= 10)
                {
                    expiredSessions.Push(sessionModel);
                }
            }

            while(expiredSessions.Count > 0)
            {
                _sessions.Remove(expiredSessions.Pop().ID);
            }
        }
    }
}
