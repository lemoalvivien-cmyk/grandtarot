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
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
};