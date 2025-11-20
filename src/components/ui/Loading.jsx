import { motion } from "framer-motion"

const Loading = () => {
  const skeletonVariants = {
    loading: {
      opacity: [0.4, 0.8, 0.4],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  }

  return (
    <div className="space-y-4 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-8">
        <motion.div 
          variants={skeletonVariants}
          animate="loading"
          className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-48"
        />
        <motion.div 
          variants={skeletonVariants}
          animate="loading"
          className="h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-32"
        />
      </div>

      {/* Quick add skeleton */}
      <motion.div 
        variants={skeletonVariants}
        animate="loading"
        className="h-14 bg-gradient-to-r from-slate-200 to-slate-300 rounded-xl mb-6"
      />

      {/* Filter controls skeleton */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div
            key={i}
            variants={skeletonVariants}
            animate="loading"
            className="h-10 bg-gradient-to-r from-slate-200 to-slate-300 rounded-lg w-24"
          />
        ))}
      </div>

      {/* Task cards skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div
            key={i}
            variants={skeletonVariants}
            animate="loading"
            className="bg-white rounded-xl p-4 shadow-sm border space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full" />
                  <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-3/4" />
                </div>
                <div className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-1/2" />
                <div className="flex items-center gap-2">
                  <div className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full w-16" />
                  <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-20" />
                </div>
              </div>
              <div className="w-6 h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default Loading