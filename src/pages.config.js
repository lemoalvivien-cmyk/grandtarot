import AdminAiPrompts from './pages/AdminAiPrompts';
import AdminAiPromptsEditor from './pages/AdminAiPromptsEditor';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminAuditLog from './pages/AdminAuditLog';
import AdminBlogEditor from './pages/AdminBlogEditor';
import AdminCardEditor from './pages/AdminCardEditor';
import AdminContent from './pages/AdminContent';
import AdminDailyCardManager from './pages/AdminDailyCardManager';
import AdminDashboard from './pages/AdminDashboard';
import AdminModeration from './pages/AdminModeration';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';
import AdminStripeConfig from './pages/AdminStripeConfig';
import AdminSubscriptionManager from './pages/AdminSubscriptionManager';
import AdminTarotImport from './pages/AdminTarotImport';
import AdminUsers from './pages/AdminUsers';
import Affinities from './pages/Affinities';
import App from './pages/App';
import AppIntentions from './pages/AppIntentions';
import AppOnboarding from './pages/AppOnboarding';
import AppRitual from './pages/AppRitual';
import AppSettings from './pages/AppSettings';
import AppSynchros from './pages/AppSynchros';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import CardDetail from './pages/CardDetail';
import CardOfDay from './pages/CardOfDay';
import Chat from './pages/Chat';
import Cookies from './pages/Cookies';
import DailyReading from './pages/DailyReading';
import Dashboard from './pages/Dashboard';
import Encyclopedia from './pages/Encyclopedia';
import Landing from './pages/Landing';
import Messages from './pages/Messages';
import Onboarding from './pages/Onboarding';
import Paywall from './pages/Paywall';
import Pricing from './pages/Pricing';
import Privacy from './pages/Privacy';
import Settings from './pages/Settings';
import Subscribe from './pages/Subscribe';
import SubscribeCancel from './pages/SubscribeCancel';
import SubscribeSuccess from './pages/SubscribeSuccess';
import Terms from './pages/Terms';
import Sitemap from './pages/Sitemap';
import Robots from './pages/Robots';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminAiPrompts": AdminAiPrompts,
    "AdminAiPromptsEditor": AdminAiPromptsEditor,
    "AdminAnalytics": AdminAnalytics,
    "AdminAuditLog": AdminAuditLog,
    "AdminBlogEditor": AdminBlogEditor,
    "AdminCardEditor": AdminCardEditor,
    "AdminContent": AdminContent,
    "AdminDailyCardManager": AdminDailyCardManager,
    "AdminDashboard": AdminDashboard,
    "AdminModeration": AdminModeration,
    "AdminReports": AdminReports,
    "AdminSettings": AdminSettings,
    "AdminStripeConfig": AdminStripeConfig,
    "AdminSubscriptionManager": AdminSubscriptionManager,
    "AdminTarotImport": AdminTarotImport,
    "AdminUsers": AdminUsers,
    "Affinities": Affinities,
    "App": App,
    "AppIntentions": AppIntentions,
    "AppOnboarding": AppOnboarding,
    "AppRitual": AppRitual,
    "AppSettings": AppSettings,
    "AppSynchros": AppSynchros,
    "Blog": Blog,
    "BlogPost": BlogPost,
    "CardDetail": CardDetail,
    "CardOfDay": CardOfDay,
    "Chat": Chat,
    "Cookies": Cookies,
    "DailyReading": DailyReading,
    "Dashboard": Dashboard,
    "Encyclopedia": Encyclopedia,
    "Landing": Landing,
    "Messages": Messages,
    "Onboarding": Onboarding,
    "Paywall": Paywall,
    "Pricing": Pricing,
    "Privacy": Privacy,
    "Settings": Settings,
    "Subscribe": Subscribe,
    "SubscribeCancel": SubscribeCancel,
    "SubscribeSuccess": SubscribeSuccess,
    "Terms": Terms,
    "Sitemap": Sitemap,
    "Robots": Robots,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};