import React from "react";
import { motion } from "framer-motion";
import { useAuth } from "@workspace/replit-auth-web";
import {
  CheckCircle2,
  Target,
  Flame,
  BookOpen,
  BarChart3,
  Timer,
  ArrowRight,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

const features = [
  { icon: CheckCircle2, title: "Smart Tasks", desc: "Prioritize and organize your daily to-dos with color-coded priorities and categories.", color: "text-violet-400", bg: "from-violet-500/20 to-violet-600/10" },
  { icon: Target, title: "Goal Tracking", desc: "Set meaningful goals with progress bars, target dates, and custom emoji icons.", color: "text-pink-400", bg: "from-pink-500/20 to-pink-600/10" },
  { icon: Flame, title: "Daily Routines", desc: "Build lasting habits with streak counters and satisfying completion animations.", color: "text-orange-400", bg: "from-orange-500/20 to-orange-600/10" },
  { icon: BookOpen, title: "Journal", desc: "Reflect daily with mood tracking, tags, and a beautiful writing experience.", color: "text-emerald-400", bg: "from-emerald-500/20 to-emerald-600/10" },
  { icon: BarChart3, title: "Analytics", desc: "Visualize your progress with beautiful charts and weekly productivity insights.", color: "text-blue-400", bg: "from-blue-500/20 to-blue-600/10" },
  { icon: Timer, title: "Focus Timer", desc: "Deep work sessions with a Pomodoro timer and ambient concentration aids.", color: "text-yellow-400", bg: "from-yellow-500/20 to-yellow-600/10" },
];

const testimonials = [
  { name: "Alex M.", role: "Product Designer", text: "LifeOS completely transformed how I manage my days. The design is stunning!", stars: 5 },
  { name: "Sarah K.", role: "Software Engineer", text: "Finally an app that's both beautiful and actually useful. The routines feature is addictive.", stars: 5 },
  { name: "James R.", role: "Entrepreneur", text: "I love how everything is in one place. My productivity has skyrocketed.", stars: 5 },
];

export default function Landing() {
  const { login } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-background overflow-y-auto">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-wide">LifeOS</span>
        </div>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={login}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 text-white text-sm font-semibold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow flex items-center gap-2"
        >
          Get Started <ArrowRight className="w-4 h-4" />
        </motion.button>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-20 overflow-hidden">
        {/* Background gradients */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-600/15 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-pink-600/10 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[80px]" />
        </div>

        {/* Floating orbs */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-violet-500/20 to-pink-500/20 blur-sm"
            style={{
              width: Math.random() * 60 + 20,
              height: Math.random() * 60 + 20,
              left: `${Math.random() * 80 + 10}%`,
              top: `${Math.random() * 80 + 10}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 max-w-4xl mx-auto"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-sm font-medium mb-8">
            <Zap className="w-4 h-4 text-yellow-400" />
            Your life. Beautifully organized.
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            Live with{" "}
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-violet-400 bg-clip-text text-transparent">
              purpose
            </span>
            {" "}every{" "}
            <span className="bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
              single day
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            LifeOS brings together your tasks, goals, habits, and reflections in one stunning workspace. Stop juggling apps — start living intentionally.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 20px 60px rgba(139,92,246,0.5)" }}
              whileTap={{ scale: 0.97 }}
              onClick={login}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold text-lg shadow-lg shadow-violet-500/30 flex items-center justify-center gap-3"
            >
              <Sparkles className="w-5 h-5" />
              Start for Free
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <button
              onClick={login}
              className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2"
            >
              Log in
            </button>
          </motion.div>

          <motion.p variants={itemVariants} className="mt-6 text-sm text-muted-foreground">
            No credit card required · Free forever
          </motion.p>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative px-6 py-24 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              thrive
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Six powerful modules that work together to help you build the life you want.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/8 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feat.icon className={`w-6 h-6 ${feat.color}`} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{feat.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative px-6 py-24 bg-white/2">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">Loved by thousands</h2>
          <p className="text-muted-foreground">Join people who transformed their productivity</p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="p-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(t.stars)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              <p className="text-white/80 text-sm leading-relaxed mb-4">"{t.text}"</p>
              <div>
                <p className="text-white font-semibold text-sm">{t.name}</p>
                <p className="text-muted-foreground text-xs">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative px-6 py-24 text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-violet-600/15 rounded-full blur-[80px]" />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-2xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to{" "}
            <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
              level up?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground mb-10">
            Join LifeOS today and start building the life you've always imagined.
          </p>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 20px 60px rgba(139,92,246,0.5)" }}
            whileTap={{ scale: 0.97 }}
            onClick={login}
            className="px-10 py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-600 text-white font-bold text-xl shadow-2xl shadow-violet-500/30 flex items-center justify-center gap-3 mx-auto"
          >
            <Sparkles className="w-6 h-6" />
            Get Started Free
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-muted-foreground text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="text-white font-semibold">LifeOS</span>
        </div>
        <p>Your all-in-one life management system</p>
      </footer>
    </div>
  );
}
