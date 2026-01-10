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
import AdminReleaseCheck from './pages/AdminReleaseCheck';
import AdminReports from './pages/AdminReports';
import AdminSecuritySelftest from './pages/AdminSecuritySelftest';
import AdminSettings from './pages/AdminSettings';
import AdminStripeConfig from './pages/AdminStripeConfig';
import AdminSubscriptionManager from './pages/AdminSubscriptionManager';
import AdminSubscriptionSync from './pages/AdminSubscriptionSync';
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
import CreateReport from './pages/CreateReport';
import DailyReading from './pages/DailyReading';
import Dashboard from './pages/Dashboard';
import Encyclopedia from './pages/Encyclopedia';
import Landing from './pages/Landing';
import ManageSubscription from './pages/ManageSubscription';
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
import AdminBackfillMessages from './pages/AdminBackfillMessages';
import AdminSecurityWarning from './pages/AdminSecurityWarning';
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
    "AdminReleaseCheck": AdminReleaseCheck,
    "AdminReports": AdminReports,
    "AdminSecuritySelftest": AdminSecuritySelftest,
    "AdminSettings": AdminSettings,
    "AdminStripeConfig": AdminStripeConfig,
    "AdminSubscriptionManager": AdminSubscriptionManager,
    "AdminSubscriptionSync": AdminSubscriptionSync,
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
    "CreateReport": CreateReport,
    "DailyReading": DailyReading,
    "Dashboard": Dashboard,
    "Encyclopedia": Encyclopedia,
    "Landing": Landing,
    "ManageSubscription": ManageSubscription,
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
    "AdminBackfillMessages": AdminBackfillMessages,
    "AdminSecurityWarning": AdminSecurityWarning,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};