import Landing from './pages/Landing';
import CardOfDay from './pages/CardOfDay';
import Encyclopedia from './pages/Encyclopedia';
import CardDetail from './pages/CardDetail';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Paywall from './pages/Paywall';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import AdminDashboard from './pages/AdminDashboard';
import DailyReading from './pages/DailyReading';
import Affinities from './pages/Affinities';
import Messages from './pages/Messages';
import Chat from './pages/Chat';
import Settings from './pages/Settings';


export const PAGES = {
    "Landing": Landing,
    "CardOfDay": CardOfDay,
    "Encyclopedia": Encyclopedia,
    "CardDetail": CardDetail,
    "Blog": Blog,
    "BlogPost": BlogPost,
    "Paywall": Paywall,
    "Dashboard": Dashboard,
    "Onboarding": Onboarding,
    "AdminDashboard": AdminDashboard,
    "DailyReading": DailyReading,
    "Affinities": Affinities,
    "Messages": Messages,
    "Chat": Chat,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
};