import { EXERCISE_GUIDES } from './exerciseGuides'
import type { Equipment, ExerciseDef } from './types'

type Seed = Omit<ExerciseDef, 'substituteIds' | 'isBodyweight' | 'steps' | 'aliases'>

const SEEDS: Seed[] = [
  // Squat
  { id: 'bodyweight-squat', name: 'Bodyweight squat', pattern: 'squat', equipment: ['bodyweight'], difficulty: 1, isCompound: true, muscleGroups: ['quads', 'glutes'],
    description: 'Sit your hips back and down as if into a chair, then stand back up.',
    formCues: ['Feet about shoulder-width, toes slightly out', 'Chest up, heels flat on the floor', 'Go as low as feels comfortable'] },
  { id: 'goblet-squat', name: 'Goblet squat', pattern: 'squat', equipment: ['dumbbells'], difficulty: 1, isCompound: true, muscleGroups: ['quads', 'glutes'],
    description: 'Hold one dumbbell at your chest and squat down between your knees.',
    formCues: ['Hold the dumbbell close, elbows pointing down', 'Push your knees out over your toes', 'Stand up by pressing through your whole foot'] },
  { id: 'band-squat', name: 'Banded squat', pattern: 'squat', equipment: ['bands'], difficulty: 1, isCompound: true, muscleGroups: ['quads', 'glutes'],
    description: 'Stand on a band, hold the ends at your shoulders and squat.',
    formCues: ['Band under the middle of both feet', 'Hands stay at shoulder height', 'Squeeze your glutes as you stand'] },
  { id: 'leg-press', name: 'Leg press', pattern: 'squat', equipment: ['gym'], difficulty: 1, isCompound: true, muscleGroups: ['quads', 'glutes'],
    description: 'Push the machine platform away with your legs, then lower it slowly.',
    formCues: ['Feet flat, hip-width on the platform', 'Lower until knees are near 90 degrees', 'Keep a slight bend in your knees at the top'] },
  { id: 'barbell-back-squat', name: 'Barbell back squat', pattern: 'squat', equipment: ['gym'], difficulty: 3, isCompound: true, muscleGroups: ['quads', 'glutes', 'hamstrings'],
    description: 'With a bar across your upper back, squat down and stand back up.',
    formCues: ['Brace your core before each rep', 'Knees track in line with your toes', 'Keep the bar over the middle of your foot'] },

  // Hinge
  { id: 'glute-bridge', name: 'Glute bridge', pattern: 'hinge', equipment: ['bodyweight'], difficulty: 1, isCompound: true, muscleGroups: ['glutes', 'hamstrings'],
    description: 'Lie on your back with knees bent and lift your hips toward the ceiling.',
    formCues: ['Feet flat, close to your hips', 'Lift with your glutes, not your lower back', 'Pause for a second at the top'] },
  { id: 'single-leg-glute-bridge', name: 'Single-leg glute bridge', pattern: 'hinge', equipment: ['bodyweight'], difficulty: 2, isCompound: true, muscleGroups: ['glutes', 'hamstrings'],
    description: 'A glute bridge with one foot on the floor and the other leg held straight.',
    formCues: ['Keep your hips level', 'Drive through the heel on the floor', 'Do all reps on one side, then switch'] },
  { id: 'dumbbell-romanian-deadlift', name: 'Dumbbell Romanian deadlift', pattern: 'hinge', equipment: ['dumbbells'], difficulty: 2, isCompound: true, muscleGroups: ['hamstrings', 'glutes', 'back'],
    description: 'Holding dumbbells, push your hips back to lower them along your legs, then stand up.',
    formCues: ['Soft knees and a flat back', 'Push your hips back as if closing a door with them', 'Stand up once you feel a hamstring stretch'] },
  { id: 'band-good-morning', name: 'Banded good morning', pattern: 'hinge', equipment: ['bands'], difficulty: 2, isCompound: true, muscleGroups: ['hamstrings', 'glutes', 'back'],
    description: 'With a band under your feet and behind your shoulders, hinge forward and stand back up.',
    formCues: ['Band under your feet, looped behind your upper back', 'Hinge at the hips with a flat back', 'Squeeze your glutes to stand tall'] },
  { id: 'romanian-deadlift', name: 'Barbell Romanian deadlift', pattern: 'hinge', equipment: ['gym'], difficulty: 2, isCompound: true, muscleGroups: ['hamstrings', 'glutes', 'back'],
    description: 'Holding a barbell, push your hips back to lower it to mid-shin, then stand up.',
    formCues: ['Keep the bar close to your legs', 'Flat back, soft knees', 'Lower only as far as your back stays flat'] },

  // Lunge
  { id: 'split-squat', name: 'Split squat', pattern: 'lunge', equipment: ['bodyweight'], difficulty: 1, isCompound: true, muscleGroups: ['quads', 'glutes'],
    description: 'In a long staggered stance, lower your back knee toward the floor and rise.',
    formCues: ['Front heel stays down', 'Drop straight down, not forward', 'Do all reps on one side, then switch'] },
  { id: 'bodyweight-reverse-lunge', name: 'Reverse lunge', pattern: 'lunge', equipment: ['bodyweight'], difficulty: 1, isCompound: true, muscleGroups: ['quads', 'glutes'],
    description: 'Step one foot back, lower until both knees bend, then step back to standing.',
    formCues: ['Take a long step back', 'Keep your chest up', 'Push through the front foot to return'] },
  { id: 'dumbbell-reverse-lunge', name: 'Dumbbell reverse lunge', pattern: 'lunge', equipment: ['dumbbells'], difficulty: 2, isCompound: true, muscleGroups: ['quads', 'glutes'],
    description: 'A reverse lunge holding a dumbbell in each hand.',
    formCues: ['Dumbbells hang at your sides', 'Back knee lowers toward the floor', 'Push through the front foot to return'] },
  { id: 'dumbbell-step-up', name: 'Dumbbell step-up', pattern: 'lunge', equipment: ['dumbbells'], difficulty: 2, isCompound: true, muscleGroups: ['quads', 'glutes'],
    description: 'Holding dumbbells, step up onto a sturdy box or stair and step back down.',
    formCues: ['Whole foot on the step', 'Push through the top leg, not the bottom one', 'Step down slowly'] },

  // Horizontal push
  { id: 'incline-push-up', name: 'Incline push-up', pattern: 'horizontalPush', equipment: ['bodyweight'], difficulty: 1, isCompound: true, muscleGroups: ['chest', 'triceps', 'shoulders'],
    description: 'A push-up with your hands on a counter, bench or sturdy table.',
    formCues: ['Body in a straight line from head to heels', 'Elbows at about 45 degrees from your body', 'Lower your chest to the edge'] },
  { id: 'push-up', name: 'Push-up', pattern: 'horizontalPush', equipment: ['bodyweight'], difficulty: 2, isCompound: true, muscleGroups: ['chest', 'triceps', 'shoulders'],
    description: 'From a high plank, lower your chest to the floor and press back up.',
    formCues: ['Hands just wider than your shoulders', 'Keep your hips in line, no sagging', 'Drop to your knees if needed'] },
  { id: 'dumbbell-floor-press', name: 'Dumbbell floor press', pattern: 'horizontalPush', equipment: ['dumbbells'], difficulty: 1, isCompound: true, muscleGroups: ['chest', 'triceps'],
    description: 'Lying on the floor, press dumbbells up from your chest.',
    formCues: ['Knees bent, feet flat', 'Lower until your upper arms touch the floor', 'Press straight up over your chest'] },
  { id: 'band-chest-press', name: 'Band chest press', pattern: 'horizontalPush', equipment: ['bands'], difficulty: 1, isCompound: true, muscleGroups: ['chest', 'triceps'],
    description: 'With a band anchored behind you, press the handles straight forward.',
    formCues: ['Stagger your stance for balance', 'Press to full arm extension', 'Return slowly against the band'] },
  { id: 'dumbbell-bench-press', name: 'Dumbbell bench press', pattern: 'horizontalPush', equipment: ['gym'], difficulty: 2, isCompound: true, muscleGroups: ['chest', 'triceps', 'shoulders'],
    description: 'Lying on a bench, lower dumbbells to your chest and press them up.',
    formCues: ['Feet planted, shoulder blades pulled back', 'Lower with control to chest level', 'Press up and slightly together'] },
  { id: 'barbell-bench-press', name: 'Barbell bench press', pattern: 'horizontalPush', equipment: ['gym'], difficulty: 3, isCompound: true, muscleGroups: ['chest', 'triceps', 'shoulders'],
    description: 'Lying on a bench, lower the bar to your chest and press it up.',
    formCues: ['Use a spotter or safety arms', 'Touch the bar to mid-chest', 'Keep your wrists stacked over elbows'] },

  // Vertical push
  { id: 'pike-push-up', name: 'Pike push-up', pattern: 'verticalPush', equipment: ['bodyweight'], difficulty: 2, isCompound: true, muscleGroups: ['shoulders', 'triceps'],
    description: 'With hips high in an upside-down V, bend your elbows to lower your head toward the floor.',
    formCues: ['Hips high, weight over your hands', 'Head goes forward of your hands', 'Press back up to the V'] },
  { id: 'dumbbell-shoulder-press', name: 'Dumbbell shoulder press', pattern: 'verticalPush', equipment: ['dumbbells'], difficulty: 1, isCompound: true, muscleGroups: ['shoulders', 'triceps'],
    description: 'Press dumbbells from your shoulders to overhead, seated or standing.',
    formCues: ['Ribs down, core tight', 'Press straight up, not forward', 'Lower to ear level'] },
  { id: 'band-overhead-press', name: 'Band overhead press', pattern: 'verticalPush', equipment: ['bands'], difficulty: 1, isCompound: true, muscleGroups: ['shoulders', 'triceps'],
    description: 'Standing on a band, press the handles from your shoulders to overhead.',
    formCues: ['Band under both feet', 'Squeeze your glutes to avoid leaning back', 'Lock out overhead, then lower slowly'] },
  { id: 'barbell-overhead-press', name: 'Barbell overhead press', pattern: 'verticalPush', equipment: ['gym'], difficulty: 3, isCompound: true, muscleGroups: ['shoulders', 'triceps'],
    description: 'Standing, press a barbell from your collarbone to overhead.',
    formCues: ['Grip just outside your shoulders', 'Move your head back as the bar passes', 'Finish with the bar over your mid-foot'] },

  // Horizontal pull
  { id: 'doorway-row', name: 'Doorway row', pattern: 'horizontalPull', equipment: ['bodyweight'], difficulty: 1, isCompound: true, muscleGroups: ['back', 'biceps'],
    description: 'Hold both sides of a sturdy door frame, lean back and pull yourself in.',
    formCues: ['Feet close to the frame, body straight', 'Pull your elbows back past your ribs', 'Walk your feet in to make it harder'] },
  { id: 'inverted-row', name: 'Inverted row', pattern: 'horizontalPull', equipment: ['bodyweight'], difficulty: 2, isCompound: true, muscleGroups: ['back', 'biceps'],
    description: 'Hanging under a sturdy table or low bar, pull your chest up to it.',
    formCues: ['Only use something that will not tip', 'Body straight from head to heels', 'Squeeze your shoulder blades at the top'] },
  { id: 'dumbbell-row', name: 'One-arm dumbbell row', pattern: 'horizontalPull', equipment: ['dumbbells'], difficulty: 1, isCompound: true, muscleGroups: ['back', 'biceps'],
    description: 'With one hand braced on a bench or chair, row a dumbbell to your hip.',
    formCues: ['Flat back, braced on your free hand', 'Pull the dumbbell toward your hip', 'Lower until your arm is straight'] },
  { id: 'band-row', name: 'Band row', pattern: 'horizontalPull', equipment: ['bands'], difficulty: 1, isCompound: true, muscleGroups: ['back', 'biceps'],
    description: 'With a band anchored in front of you, pull the handles to your ribs.',
    formCues: ['Sit or stand tall', 'Lead with your elbows', 'Squeeze your shoulder blades together'] },
  { id: 'seated-cable-row', name: 'Seated cable row', pattern: 'horizontalPull', equipment: ['gym'], difficulty: 1, isCompound: true, muscleGroups: ['back', 'biceps'],
    description: 'Seated at a cable machine, pull the handle to your stomach.',
    formCues: ['Sit tall, slight bend in your knees', 'Pull to your belly button', 'Let your arms straighten fully between reps'] },

  // Vertical pull
  { id: 'superman-pull', name: 'Superman pull', pattern: 'verticalPull', equipment: ['bodyweight'], difficulty: 1, isCompound: false, muscleGroups: ['back'],
    description: 'Lying face down, lift your chest and pull your elbows down to your sides.',
    formCues: ['Start with arms straight overhead', 'Squeeze your upper back as elbows come down', 'Keep your neck long, eyes on the floor'] },
  { id: 'dumbbell-pullover', name: 'Dumbbell pullover', pattern: 'verticalPull', equipment: ['dumbbells'], difficulty: 2, isCompound: false, muscleGroups: ['back', 'chest'],
    description: 'Lying down, lower one dumbbell behind your head with straight arms, then pull it back over your chest.',
    formCues: ['Hold one end of the dumbbell with both hands', 'Keep a slight bend in your elbows', 'Stop when you feel a stretch'] },
  { id: 'band-pulldown', name: 'Band pulldown', pattern: 'verticalPull', equipment: ['bands'], difficulty: 1, isCompound: true, muscleGroups: ['back', 'biceps'],
    description: 'With a band anchored high, pull the handles down to your shoulders.',
    formCues: ['Kneel or stand under the anchor', 'Pull your elbows down to your sides', 'Control the return'] },
  { id: 'lat-pulldown', name: 'Lat pulldown', pattern: 'verticalPull', equipment: ['gym'], difficulty: 1, isCompound: true, muscleGroups: ['back', 'biceps'],
    description: 'Seated at the machine, pull the bar down to your upper chest.',
    formCues: ['Grip a little wider than your shoulders', 'Lean back slightly, chest up', 'Pull the bar to your collarbone'] },

  // Arms and shoulders
  { id: 'dumbbell-curl', name: 'Dumbbell curl', pattern: 'biceps', equipment: ['dumbbells'], difficulty: 1, isCompound: false, muscleGroups: ['biceps'],
    description: 'Curl dumbbells from your thighs up to your shoulders.',
    formCues: ['Elbows stay pinned at your sides', 'No swinging', 'Lower slowly'] },
  { id: 'band-curl', name: 'Band curl', pattern: 'biceps', equipment: ['bands'], difficulty: 1, isCompound: false, muscleGroups: ['biceps'],
    description: 'Standing on a band, curl the handles up to your shoulders.',
    formCues: ['Elbows stay at your sides', 'Squeeze at the top', 'Resist the band on the way down'] },
  { id: 'bench-dip', name: 'Chair dip', pattern: 'triceps', equipment: ['bodyweight'], difficulty: 2, isCompound: false, muscleGroups: ['triceps', 'chest'],
    description: 'Hands on the edge of a sturdy chair behind you, bend your elbows to lower, then press up.',
    formCues: ['Keep your hips close to the chair', 'Lower until elbows reach about 90 degrees', 'Bend your knees to make it easier'] },
  { id: 'dumbbell-overhead-extension', name: 'Overhead triceps extension', pattern: 'triceps', equipment: ['dumbbells'], difficulty: 1, isCompound: false, muscleGroups: ['triceps'],
    description: 'Holding one dumbbell overhead with both hands, lower it behind your head and press back up.',
    formCues: ['Elbows point forward, close to your head', 'Only your forearms move', 'Keep your ribs down'] },
  { id: 'band-pushdown', name: 'Band triceps pushdown', pattern: 'triceps', equipment: ['bands'], difficulty: 1, isCompound: false, muscleGroups: ['triceps'],
    description: 'With a band anchored high, push the ends down until your arms are straight.',
    formCues: ['Elbows pinned at your sides', 'Straighten your arms fully', 'Return slowly'] },
  { id: 'cable-pushdown', name: 'Cable triceps pushdown', pattern: 'triceps', equipment: ['gym'], difficulty: 1, isCompound: false, muscleGroups: ['triceps'],
    description: 'At a cable machine, push the handle down until your arms are straight.',
    formCues: ['Elbows pinned at your sides', 'Stand tall, slight forward lean', 'Control the handle back up'] },
  { id: 'dumbbell-lateral-raise', name: 'Dumbbell lateral raise', pattern: 'shoulders', equipment: ['dumbbells'], difficulty: 1, isCompound: false, muscleGroups: ['shoulders'],
    description: 'Raise light dumbbells out to your sides up to shoulder height.',
    formCues: ['Slight bend in your elbows', 'Lead with your elbows, not your hands', 'Stop at shoulder height'] },
  { id: 'band-lateral-raise', name: 'Band lateral raise', pattern: 'shoulders', equipment: ['bands'], difficulty: 1, isCompound: false, muscleGroups: ['shoulders'],
    description: 'Standing on a band, raise the handles out to your sides.',
    formCues: ['Slight bend in your elbows', 'Raise to shoulder height', 'Lower slowly'] },

  // Core
  { id: 'plank', name: 'Plank', pattern: 'core', equipment: ['bodyweight'], difficulty: 1, isCompound: false, muscleGroups: ['core'], timed: true,
    description: 'Hold a straight line from head to heels on your forearms and toes.',
    formCues: ['Elbows under your shoulders', 'Squeeze your glutes and brace your stomach', 'Drop to your knees if your hips sag'] },
  { id: 'side-plank', name: 'Side plank', pattern: 'core', equipment: ['bodyweight'], difficulty: 1, isCompound: false, muscleGroups: ['core'], timed: true,
    description: 'Hold your body in a straight line on one forearm and the side of your feet.',
    formCues: ['Elbow under your shoulder', 'Hips lifted, not sagging', 'Split the time between both sides'] },
  { id: 'dead-bug', name: 'Dead bug', pattern: 'core', equipment: ['bodyweight'], difficulty: 1, isCompound: false, muscleGroups: ['core'],
    description: 'On your back with arms and knees up, slowly lower the opposite arm and leg.',
    formCues: ['Press your lower back into the floor', 'Move slowly and breathe out as you extend', 'Count each side as one rep'] },
  { id: 'bird-dog', name: 'Bird dog', pattern: 'core', equipment: ['bodyweight'], difficulty: 1, isCompound: false, muscleGroups: ['core', 'back'],
    description: 'On hands and knees, reach one arm forward and the opposite leg back.',
    formCues: ['Keep your back flat like a table', 'Reach long, don’t lift high', 'Pause for a second each rep'] },
]

/** Extra substitutes where the same movement pattern has no bodyweight or dumbbell option. */
const EXTRA_SUBSTITUTES: Record<string, string[]> = {
  'dumbbell-curl': ['doorway-row'],
  'band-curl': ['doorway-row'],
  'dumbbell-lateral-raise': ['pike-push-up'],
  'band-lateral-raise': ['pike-push-up'],
}

const EQUIPMENT_ORDER: Equipment[] = ['bodyweight', 'dumbbells', 'bands', 'gym']
const equipmentRank = (e: Seed) => Math.min(...e.equipment.map((x) => EQUIPMENT_ORDER.indexOf(x)))

function buildLibrary(): ExerciseDef[] {
  return SEEDS.map((seed) => {
    const samePattern = SEEDS.filter((o) => o.pattern === seed.pattern && o.id !== seed.id)
      .sort((a, b) => equipmentRank(a) - equipmentRank(b) || a.difficulty - b.difficulty)
      .map((o) => o.id)
    return {
      ...seed,
      isBodyweight: seed.equipment.includes('bodyweight'),
      substituteIds: [...samePattern, ...(EXTRA_SUBSTITUTES[seed.id] ?? [])],
      steps: EXERCISE_GUIDES[seed.id]?.steps ?? [],
      aliases: EXERCISE_GUIDES[seed.id]?.aliases ?? [],
    }
  })
}

export const EXERCISE_LIBRARY: ExerciseDef[] = buildLibrary()

export const EXERCISES_BY_ID: ReadonlyMap<string, ExerciseDef> = new Map(EXERCISE_LIBRARY.map((e) => [e.id, e]))

/** Bodyweight is always available; a full gym also covers dumbbells and bands. */
export function expandEquipment(selected: Equipment[]): Set<Equipment> {
  const set = new Set<Equipment>(selected)
  set.add('bodyweight')
  if (set.has('gym')) {
    set.add('dumbbells')
    set.add('bands')
  }
  return set
}

export function isAvailable(exercise: Pick<ExerciseDef, 'equipment'>, available: Set<Equipment>): boolean {
  return exercise.equipment.some((e) => available.has(e))
}
