/**
 * A short video demonstration for each exercise in the library, hosted on YouTube.
 * Chosen for showing that exact movement in under 4 minutes, from established sources where
 * possible (physical therapists, hospitals, certification bodies, major fitness channels).
 * Each was checked as public and embeddable through YouTube's oEmbed service on 2026-10-17.
 * Outside videos can disappear, so recheck these every few months.
 */
export interface ExerciseVideo {
  /** YouTube video id. */
  youtubeId: string
  title: string
  channel: string
  seconds: number
}

export const EXERCISE_VIDEOS: Record<string, ExerciseVideo> = {
  'bodyweight-squat': { youtubeId: 'm0GcZ24pK6k', title: "How to do a body weight squat | Bupa Health", channel: "Bupa Health", seconds: 38 },
  'goblet-squat': { youtubeId: 'CkFzgR55gho', title: "How to Perform Dumbbell Goblet Squat", channel: "Physique Development", seconds: 87 },
  'band-squat': { youtubeId: 'Eaqr79zvqIw', title: "How To: Resistance Band Squat", channel: "Live Lean TV Daily Exercises", seconds: 37 },
  'leg-press': { youtubeId: '8EMbB0tCn7Q', title: "HOW TO: Seated Leg Press", channel: "Goodlife Health Clubs", seconds: 51 },
  'barbell-back-squat': { youtubeId: 'rrJIyZGlK8c', title: "How To Do A Barbell Back Squat", channel: "PureGym", seconds: 24 },
  'glute-bridge': { youtubeId: 'PhTDzR0TpZs', title: "How to Do a Glute Bridge Exercise: A Guide from Physical Therapists", channel: "Hinge Health", seconds: 54 },
  'single-leg-glute-bridge': { youtubeId: 'AVAXhy6pl7o', title: "Strengthening Exercise for ACL: Single Leg Bridge", channel: "MedStar Health", seconds: 27 },
  'dumbbell-romanian-deadlift': { youtubeId: 'hQgFixeXdZo', title: "Dumbbell Romanian (RDL) Deadlift |TECHNIQUE for Beginners", channel: "Mike | J2FIT Strength & Conditioning", seconds: 79 },
  'band-good-morning': { youtubeId: 'fJA39ZOVaEQ', title: "How To Do Banded Good Mornings", channel: "Rogue Fitness", seconds: 33 },
  'romanian-deadlift': { youtubeId: '7j-2w4-P14I', title: "Romanian Deadlift | Nuffield Health", channel: "Nuffield Health", seconds: 42 },
  'split-squat': { youtubeId: 'hXpGSa5HYqY', title: "How to do a SPLIT SQUAT", channel: "Atomic Athlete", seconds: 25 },
  'bodyweight-reverse-lunge': { youtubeId: 'Ry-wqegeKlE', title: "How To Perform The Reverse Lunge", channel: "Dr. Carl Baird", seconds: 59 },
  'dumbbell-reverse-lunge': { youtubeId: 'RZKXLMxPF_I', title: "Dumbbell Reverse Lunges | How To | Proper Form & Technique", channel: "FITTR", seconds: 67 },
  'dumbbell-step-up': { youtubeId: '7AtIjR-QqVA', title: "Dumbbell Step Ups - Leg Exercise - Bodybuilding.com", channel: "Bodybuilding.com", seconds: 48 },
  'incline-push-up': { youtubeId: 'Me9bHFAxnCs', title: "How to do an Incline Pushup | Tiger Fitness", channel: "Tiger Fitness", seconds: 37 },
  'push-up': { youtubeId: 'WDIpL0pjun0', title: "How to do a Push-Up | Proper Form & Technique | NASM", channel: "National Academy of Sports Medicine (NASM)", seconds: 14 },
  'dumbbell-floor-press': { youtubeId: 'uUGDRwge4F8', title: "How To: Dumbbell Floor Press", channel: "ScottHermanFitness", seconds: 99 },
  'band-chest-press': { youtubeId: '6-86jEAXA08', title: "How To: Standing Resistance Band Chest Press", channel: "Live Lean TV Daily Exercises", seconds: 60 },
  'dumbbell-bench-press': { youtubeId: 'X3YrlBmjWrY', title: "DumbBell Bench Press", channel: "LivestrongWoman", seconds: 54 },
  'barbell-bench-press': { youtubeId: 'ukDEXCXJxdM', title: "Barbell Bench Press Medium-Grip | Exercise Guide", channel: "Bodybuilding.com", seconds: 77 },
  'pike-push-up': { youtubeId: 'x7_I5SUAd00', title: "Pike Pushup", channel: "LivestrongWoman", seconds: 49 },
  'dumbbell-shoulder-press': { youtubeId: '0JfYxMRsUCQ', title: "Dumbbell Shoulder Press | Exercise Guide", channel: "Bodybuilding.com", seconds: 62 },
  'band-overhead-press': { youtubeId: 'Zli1UXH9ZeE', title: "Band Overhead Press", channel: "FitnessBlender", seconds: 38 },
  'barbell-overhead-press': { youtubeId: 'RoY7aG94X_Y', title: "Standing Barbell Overhead Press", channel: "Women's Strength Nation by Holly Perkins", seconds: 47 },
  'doorway-row': { youtubeId: 'r8NzhNe9Res', title: "Door Frame Rows", channel: "Sul Ross State Sports Performance", seconds: 67 },
  'inverted-row': { youtubeId: '9fItzuh9Iok', title: "Inverted Rows", channel: "The Active Life", seconds: 33 },
  'dumbbell-row': { youtubeId: 'nehAvSrfUOg', title: "How to: One Arm Dumbbell Row - Alexandra Wilson", channel: "Alexandra Wilson", seconds: 76 },
  'band-row': { youtubeId: 'LSkyinhmA8k', title: "How To Do A Resistance Band Row", channel: "Get Healthy U - with Chris Freytag", seconds: 49 },
  'seated-cable-row': { youtubeId: 'xQNrFHEMhI4', title: "Seated Cable Row | Exercise Guide", channel: "Bodybuilding.com", seconds: 93 },
  'superman-pull': { youtubeId: '0rVIf0RpZcA', title: "How To Do A SUPERMAN W PULL | Exercise Demonstration Video and Guide", channel: "Live Lean TV Daily Exercises", seconds: 31 },
  'dumbbell-pullover': { youtubeId: 'ieFKuQAGYIA', title: "Dumbbell Pullover on Floor", channel: "The Active Life", seconds: 25 },
  'band-pulldown': { youtubeId: '94A3JVWqpdg', title: "How to do a seated lat pull down with a band", channel: "Rehab My Patient", seconds: 45 },
  'lat-pulldown': { youtubeId: 'kwJeh3QyhVE', title: "How-To Use the \"Lat Pulldown\" Machine", channel: "Tri Cities Gold's Gym", seconds: 68 },
  'dumbbell-curl': { youtubeId: 'cBSD6mQIPQk', title: "Dumbbell Bicep Curl | Nuffield Health", channel: "Nuffield Health", seconds: 36 },
  'band-curl': { youtubeId: '3g-1J2KkX_8', title: "Band Bicep Curl", channel: "FitnessBlender", seconds: 40 },
  'bench-dip': { youtubeId: 'rjdpMVtMehw', title: "How to do a Triceps Dip on a Chair at Home", channel: "Get Strong with Emily", seconds: 65 },
  'dumbbell-overhead-extension': { youtubeId: 'YM8iX9BJWjA', title: "Dumbbell Overhead Triceps Extension", channel: "Women's Strength Nation by Holly Perkins", seconds: 38 },
  'band-pushdown': { youtubeId: 'Y3CDzx-oj3k', title: "Arms | How To Do Triceps Pushdowns with Resistance Bands", channel: "Undersun Fitness", seconds: 139 },
  'cable-pushdown': { youtubeId: '8WL0m0vLAPo', title: "How to Do Triceps Push Downs", channel: "LIVESTRONG", seconds: 90 },
  'dumbbell-lateral-raise': { youtubeId: 'XPPfnSEATJA', title: "How to do a Dumbbell Lateral Raise", channel: "National Academy of Sports Medicine (NASM)", seconds: 19 },
  'band-lateral-raise': { youtubeId: 'yfNg5sFndbw', title: "Band Lateral Raise", channel: "Men's Health", seconds: 47 },
  'plank': { youtubeId: 'pvIjsG5Svck', title: "Core Exercise: Plank", channel: "Children's Hospital Colorado", seconds: 66 },
  'side-plank': { youtubeId: 'N_s9em1xTqU', title: "Core Exercise: Side Plank", channel: "Children's Hospital Colorado", seconds: 71 },
  'dead-bug': { youtubeId: 'GbSC02oU3To', title: "How to Do a Dead Bug: A Guide from Physical Therapists", channel: "Hinge Health", seconds: 73 },
  'bird-dog': { youtubeId: 'xEDnlOxeJH4', title: "How to Do the Bird Dog Exercise: A Guide from Physical Therapists", channel: "Hinge Health", seconds: 84 },
  'sumo-squat': { youtubeId: 'Sq88Uw0roVU', title: "How to Do a Sumo Squat With Dumbbells With Lita Lewis", channel: "Openfit on BODi", seconds: 58 },
  'wall-sit': { youtubeId: 'cWTZ8Am1Ee0', title: "How to Do a Wall Sit Exercise | 30 Seconds | MedBridge", channel: "Medbridge", seconds: 28 },
  'leg-extension': { youtubeId: '8Jqof7z3QYM', title: "Planet Fitness - How To Use Leg Extension Machine", channel: "Planet Fitness Beginner", seconds: 78 },
  'barbell-deadlift': { youtubeId: 'r4MzxtBKyNE', title: "How To Perfect Your Deadlift | Form Check | Men's Health", channel: "Men's Health", seconds: 185 },
  'hip-thrust': { youtubeId: 'pUdIL5x0fWg', title: "Hip Thrust | Nuffield Health", channel: "Nuffield Health", seconds: 36 },
  'leg-curl': { youtubeId: 'SbSNUXPRkc8', title: "How To Do A Lying Leg Curl (Prone Leg Curl)", channel: "PureGym", seconds: 16 },
  'band-glute-kickback': { youtubeId: 'O5-ROTyo2dA', title: "How to do a Banded Glute Kickback", channel: "Get Strong with Emily", seconds: 93 },
  'bulgarian-split-squat': { youtubeId: '7Aqeb8UHl4k', title: "Bulgarian Split Squat", channel: "Men's Health", seconds: 95 },
  'walking-lunge': { youtubeId: 'Pbmj6xPo-Hw', title: "Walking Lunges Exercise Tutorial | Build Legendary Legs & Cardio", channel: "Buff Dudes Workouts", seconds: 110 },
  'lateral-lunge': { youtubeId: '4NlJdSzHeUg', title: "Exercises with an Athletic Trainer: Lateral Lunge", channel: "Children's Hospital Colorado", seconds: 57 },
  'machine-chest-press': { youtubeId: 'sqNwDkUU_Ps', title: "How To Use The Chest Press Machine", channel: "PureGym", seconds: 61 },
  'dumbbell-fly': { youtubeId: 'QwuUZ5wgQOk', title: "Dumbbell Flyes - Chest Exercise - Bodybuilding.com", channel: "Bodybuilding.com", seconds: 55 },
  'knee-push-up': { youtubeId: 'RWS6Q4IPO-8', title: "Knee Push Up Exercise", channel: "Husky Orthopaedics", seconds: 31 },
  'arnold-press': { youtubeId: '3ml7BH7mNwQ', title: "How to do the Arnold Press", channel: "Men's Health", seconds: 155 },
  'barbell-row': { youtubeId: 'FWJR5Ve8bnQ', title: "How to do the BENT-OVER BARBELL ROW! | 2 Minute Tutorial", channel: "Max Euceda", seconds: 120 },
  'pull-up': { youtubeId: '9yVGh3XbJ34', title: "How to do a Pull-Up | Proper Form & Technique | NASM", channel: "National Academy of Sports Medicine (NASM)", seconds: 21 },
  'assisted-pull-up': { youtubeId: 'wFj808u2HWU', title: "How To Use The Assisted Pull Up Machine", channel: "PureGym", seconds: 72 },
  'hammer-curl': { youtubeId: 'BRVDS6HVR9Q', title: "How To Perform HAMMER CURLS | Biceps Exercise Tutorial", channel: "Buff Dudes Workouts", seconds: 90 },
  'barbell-curl': { youtubeId: 'dDI8ClxRS04', title: "Barbell Curl - Biceps Exercise - Bodybuilding.com", channel: "Bodybuilding.com", seconds: 45 },
  'diamond-push-up': { youtubeId: 'J0DnG1_S92I', title: "How To: Diamond Push-Up", channel: "ScottHermanFitness", seconds: 110 },
  'band-face-pull': { youtubeId: 'CSP7YpPv3ds', title: "Band Face Pull", channel: "Men's Health", seconds: 52 },
  'dumbbell-reverse-fly': { youtubeId: 'QICCsyKVP-g', title: "How To Do A Reverse Fly with Nicole Uribarri | The Right Way | Well+Good", channel: "Well+Good", seconds: 164 },
  'crunch': { youtubeId: 'O0pIQ2UqeCY', title: "Abdominal Crunch", channel: "California Department of Public Health", seconds: 78 },
  'mountain-climber': { youtubeId: 'cnyTQDSE884', title: "How to Do Mountain Climbers | The Right Way | Well+Good", channel: "Well+Good", seconds: 77 },
  'russian-twist': { youtubeId: 'GBNowwdWXJQ', title: "How to Do a Russian Twist", channel: "LIVESTRONG", seconds: 95 },
  'hanging-knee-raise': { youtubeId: 'p9hhX_Sx5v0', title: "The Hanging Knee Raise | A Tutorial", channel: "Signum Fitness & Nutrition", seconds: 45 },
  'pallof-press': { youtubeId: 'y1fOBVtANdM', title: "How to do a Standing Banded Pallof Press", channel: "TurnFit - Vancouver Personal Trainers", seconds: 39 },
  'calf-raise': { youtubeId: 'k8ipHzKeAkQ', title: "Exercises with an Athletic Trainer: Standing Calf Raises", channel: "Children's Hospital Colorado", seconds: 62 },
  'single-leg-calf-raise': { youtubeId: 'qPd73snQfUs', title: "Single-Leg Calf Raise (HSS)", channel: "Hospital for Special Surgery", seconds: 31 },
}

/** "0:38" */
export const videoLength = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
