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
}

/** "0:38" */
export const videoLength = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
