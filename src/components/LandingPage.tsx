import React from 'react';
import { CheckCircle, CreditCard, Users, Briefcase, BarChart3, Calendar, FileText, ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';

// --- Animation Variants for a professional feel ---
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggeredContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};


// --- Reusable Sub-Components for Easy Customization ---

const Header: React.FC = () => (
  <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <Link to="/" className="flex items-center space-x-2">
          <CreditCard className="w-8 h-8 text-indigo-600" />
          <span className="text-xl font-bold text-gray-900">SubAudit</span>
        </Link>
        <div className="flex items-center space-x-2">
          <Link to="/auth" className="text-sm font-semibold text-gray-600 hover:text-indigo-600 px-4 py-2">Sign In</Link>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/auth" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm">Start Free Trial</Link>
          </motion.div>
        </div>
      </div>
    </div>
  </header>
);

const HeroSection: React.FC = () => (
  <motion.section 
    variants={sectionVariants}
    className="py-20 sm:py-32 text-center bg-gray-50 overflow-hidden"
  >
    <div className="max-w-4xl mx-auto px-4">
      <motion.h1 variants={itemVariants} className="text-4xl sm:text-6xl font-bold text-gray-900 tracking-tight">
        Take Control of Every Subscription — Save Money, Every Month.
      </motion.h1>
      <motion.p variants={itemVariants} className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
        SubAudit organizes all your recurring payments in one simple dashboard. Get smart renewal alerts, yearly cost projections, and export your data to CSV or PDF in one click.
      </motion.p>
      <motion.div variants={itemVariants} className="mt-10 flex justify-center gap-x-4">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="/auth" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/50 transition-all">Start Free Trial</Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link to="#pricing" className="bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border hover:bg-gray-50 transition-colors">See Plans</Link>
        </motion.div>
      </motion.div>
    </div>
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
      className="mt-16 max-w-5xl mx-auto px-4"
    >
      <div className="bg-white p-4 rounded-xl border-2 border-gray-200 shadow-2xl">
        <img 
          src="https://images.unsplash.com/photo-1554224155-16e6a42418d2?q=80&w=2070&auto=format&fit=crop" 
          alt="Person at a desk looking at a financial dashboard" 
          className="rounded-lg"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://placehold.co/1200x600/EBF4FF/4F46E5?text=App+Preview'; }}
        />
      </div>
    </motion.div>
  </motion.section>
);

const HowItWorksSection: React.FC = () => (
  <motion.section 
    variants={sectionVariants}
    className="py-20"
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">How SubAudit Works</h2>
        <motion.div variants={staggeredContainer} className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <FeatureCard icon={CreditCard} title="1. Add Subscriptions" description="Quickly log all your recurring services."/>
            <FeatureCard icon={Calendar} title="2. Get Reminders" description="Renewal alerts ensure no surprise charges."/>
            <FeatureCard icon={BarChart3} title="3. See The Big Picture" description="Track monthly & yearly spending at a glance."/>
            <FeatureCard icon={FileText} title="4. Export Instantly" description="Download reports as CSV or PDF."/>
        </motion.div>
    </div>
  </motion.section>
);

const FeatureCard: React.FC<{icon: React.ElementType; title: string; description: string}> = ({icon: Icon, title, description}) => (
    <motion.div variants={itemVariants} className="text-center">
        <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto">
            <Icon className="w-6 h-6"/>
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-gray-600">{description}</p>
    </motion.div>
);


const SocialProofSection: React.FC = () => (
    <motion.section 
        variants={sectionVariants}
        className="py-20 bg-gray-50"
    >
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Why Choose SubAudit?</h2>
                <ul className="space-y-4 text-lg mt-8">
                    <li className="flex items-start space-x-3"><CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1"/><p className="text-gray-700">Spot wasteful subscriptions with cancellation suggestions.</p></li>
                    <li className="flex items-start space-x-3"><CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1"/><p className="text-gray-700">Export clean reports for your records or accountant.</p></li>
                    <li className="flex items-start space-x-3"><CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1"/><p className="text-gray-700">Plans designed for individuals, families, and businesses.</p></li>
                </ul>
                <img 
                    src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1911&auto=format&fit=crop"
                    alt="Person reviewing financial documents on a laptop"
                    className="rounded-xl shadow-lg mt-8"
                />
            </div>
            <div className="space-y-6">
                <TestimonialCard author="Sarah K., Freelancer" text="“SubAudit found two subscriptions I forgot I had. I’m saving over $30 a month now. A must-have tool!”" avatarUrl="https://placehold.co/48x48/EBF4FF/7F9CF5?text=SK"/>
                <TestimonialCard author="Mike R., Small Business Owner" text="“Finally, a simple way to track all our team’s SaaS tools. The PDF export is perfect for our monthly reports.”" avatarUrl="https://placehold.co/48x48/D1FAE5/10B981?text=MR"/>
            </div>
        </div>
    </motion.section>
);

const TestimonialCard: React.FC<{author: string; text: string; avatarUrl: string}> = ({author, text, avatarUrl}) => (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
        <p className="text-gray-700 text-lg">"{text}"</p>
        <div className="flex items-center space-x-3 mt-4">
            <img src={avatarUrl} alt={author} className="w-12 h-12 rounded-full"/>
            <p className="font-semibold text-gray-900">- {author}</p>
        </div>
    </div>
);


const PricingSection: React.FC = () => (
    <motion.section 
        variants={sectionVariants}
        id="pricing" 
        className="py-20"
    >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Plans & Pricing</h2>
            <motion.div variants={staggeredContainer} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <PricingCard icon={User} title="Individual Plus" price="$10.99" per="month" description="Best for: Solo users managing personal and side-business subscriptions." features={['Track up to 30 subscriptions', 'Renewal alerts + yearly projections', 'CSV & PDF export included', 'Cancellation suggestions']} />
                <PricingCard icon={Users} title="Family Premium (coming soon)" price="$20.99" per="month" description="Best for: Households juggling streaming, kids’ apps, and shared services." features={['2–6 members, 12 subs per person', 'Shared profiles with alerts', 'CSV & PDF export for each member', 'Smarter family budgeting']} isFeatured />
                <PricingCard icon={Briefcase} title="Business Starter (coming soon)" price="$29.99+" per="month" description="Best for: Startups and teams managing multiple SaaS tools and vendors." features={['Track 50+ subscriptions', 'Admin & team-ready reporting', 'Export for audits and accounting', 'Projections + cancellation insights']} />
            </motion.div>
            <div className="text-center mt-12">
                <Link to="/auth" className="text-indigo-600 font-semibold text-lg hover:underline flex items-center justify-center space-x-2">
                    <span>Choose Your Plan</span><ArrowRight/>
                </Link>
            </div>
        </div>
    </motion.section>
);

const PricingCard: React.FC<{icon: React.ElementType; title: string; price: string; per: string; description: string; features: string[]; isFeatured?: boolean}> = ({ icon: Icon, title, price, per, description, features, isFeatured }) => (
    <motion.div variants={itemVariants} whileHover={{ y: -10 }} className={`p-8 rounded-xl border-2 ${isFeatured ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xl' : 'bg-white border-gray-200'}`}>
        <Icon className={`w-8 h-8 mb-4 ${isFeatured ? 'text-white' : 'text-indigo-600'}`} />
        <h3 className="text-xl font-bold">{title}</h3>
        <p className={`my-4 ${isFeatured ? 'text-white' : 'text-gray-900'}`}><span className="text-4xl font-bold">{price}</span><span className={isFeatured ? 'text-indigo-200' : 'text-gray-400'}>/{per}</span></p>
        <ul className="space-y-3">
            {features.map(f => <li key={f} className="flex items-center space-x-2"><CheckCircle className={`w-5 h-5 ${isFeatured ? 'text-green-300' : 'text-green-500'}`}/><span>{f}</span></li>)}
        </ul>
        <p className={`mt-6 text-sm ${isFeatured ? 'text-indigo-200' : 'text-gray-600'}`}>{description}</p>
    </motion.div>
);

const FinalCTASection: React.FC = () => (
    <motion.section 
        variants={sectionVariants}
        className="py-20 bg-gray-50"
    >
        <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Ready to take back control of your subscriptions?</h2>
            <div className="mt-8 flex justify-center gap-x-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link to="/auth" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/50 transition-all">Start Free Trial Today</Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link to="#pricing" className="bg-white text-gray-700 px-6 py-3 rounded-lg font-semibold border hover:bg-gray-50 transition-colors">See All Plans</Link>
                </motion.div>
            </div>
        </div>
    </motion.section>
);

const LandingPage: React.FC = () => {
  return (
    <div className="bg-white">
      <Header />
      <main>
        <motion.div 
            initial="hidden" 
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggeredContainer}
        >
            <HeroSection />
            <HowItWorksSection />
            <SocialProofSection />
            <PricingSection />
            <FinalCTASection />
        </motion.div>
      </main>
    </div>
  );
};

export default LandingPage;
