import { Lightbulb, Leaf, CheckCircle, ArrowRight, Sparkles } from "lucide-react";

interface Solution {
  title: string;
  description: string;
  impact: string;
  difficulty: string;
}

interface SolutionsStoryCardProps {
  solutions: Solution[];
}

const getDifficultyColor = (level: string) => {
  switch (level.toLowerCase()) {
    case "easy": return "bg-emerald-500/20 text-emerald-300";
    case "medium": return "bg-amber-500/20 text-amber-300";
    case "hard": return "bg-red-500/20 text-red-300";
    default: return "bg-white/20 text-white/80";
  }
};

const getDifficultyEmoji = (level: string) => {
  switch (level.toLowerCase()) {
    case "easy": return "🌱";
    case "medium": return "🌿";
    case "hard": return "🌳";
    default: return "✨";
  }
};

const SolutionsStoryCard = ({ solutions }: SolutionsStoryCardProps) => {
  return (
    <div className="space-y-4 text-white">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Actions You Can Take</h3>
            <p className="text-sm text-white/70">
              Make a difference in your environment
            </p>
          </div>
        </div>
      </div>

      {/* Solutions list */}
      <div className="space-y-4">
        {solutions.map((solution, index) => (
          <div
            key={index}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-colors"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-lg">{solution.title}</h4>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${getDifficultyColor(solution.difficulty)}`}>
                {getDifficultyEmoji(solution.difficulty)} {solution.difficulty}
              </span>
            </div>

            {/* Description */}
            <p className="text-white/80 text-sm mb-4 leading-relaxed pl-11">
              {solution.description}
            </p>

            {/* Impact */}
            <div className="pl-11 pt-3 border-t border-white/10">
              <div className="flex items-start gap-2">
                <Leaf className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
                <div>
                  <span className="text-xs text-emerald-300 font-medium">Expected Impact</span>
                  <p className="text-sm text-white/80">{solution.impact}</p>
                </div>
              </div>
            </div>

            {/* Action button */}
            <div className="mt-4 pl-11">
              <button className="flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200 transition-colors group">
                <CheckCircle className="w-4 h-4" />
                <span>Start this action</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Motivation footer */}
      <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 backdrop-blur-sm rounded-2xl p-6 text-center mt-6 border border-emerald-500/20">
        <div className="text-4xl mb-3">🌍</div>
        <p className="text-lg font-semibold text-white mb-2">
          Every small action counts!
        </p>
        <p className="text-sm text-white/70">
          Together, we can make a significant positive impact on our environment.
        </p>
      </div>
    </div>
  );
};

export default SolutionsStoryCard;