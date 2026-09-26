/**
 * Step-by-step instructions and search aliases for the exercise guide, keyed by exercise id.
 * Kept apart from the library definitions so those stay easy to scan. A test checks every
 * exercise has a guide.
 */
export const EXERCISE_GUIDES: Record<string, { steps: string[]; aliases?: string[] }> = {
  // Squat
  'bodyweight-squat': {
    aliases: ['air squat', 'squat'],
    steps: [
      'Stand with your feet about shoulder-width apart, toes turned out slightly.',
      'Reach your arms forward for balance and brace your stomach.',
      'Push your hips back and bend your knees to lower down, keeping your chest up.',
      'Go as low as you can while your heels stay on the floor, ideally thighs parallel to the floor.',
      'Press through your whole foot to stand back up, squeezing your glutes at the top.',
    ],
  },
  'goblet-squat': {
    aliases: ['dumbbell squat', 'squat'],
    steps: [
      'Hold one dumbbell vertically against your chest, hands cupping the top end.',
      'Stand with feet a little wider than shoulder-width, toes turned out slightly.',
      'Brace your stomach, then sit down between your knees, keeping the dumbbell close.',
      'Lower until your elbows are near your knees or as deep as is comfortable.',
      'Drive through your whole foot to stand up tall.',
    ],
  },
  'band-squat': {
    aliases: ['resistance band squat', 'squat'],
    steps: [
      'Stand on the middle of the band with feet shoulder-width apart.',
      'Bring the handles or ends of the band up to your shoulders, palms facing forward.',
      'Push your hips back and bend your knees to squat down, chest up.',
      'Lower until your thighs are about parallel to the floor.',
      'Stand back up against the band and squeeze your glutes at the top.',
    ],
  },
  'leg-press': {
    aliases: ['machine leg press'],
    steps: [
      'Sit in the machine with your back and hips flat against the pad.',
      'Place your feet hip-width apart in the middle of the platform.',
      'Release the safety handles and lower the platform by bending your knees toward your chest.',
      'Stop when your knees reach about 90 degrees or your lower back starts to lift.',
      'Press the platform away until your legs are almost straight, without locking your knees.',
    ],
  },
  'barbell-back-squat': {
    aliases: ['back squat', 'squat', 'barbell squat'],
    steps: [
      'Set the bar in a rack at about armpit height, with safety arms just below your squat depth.',
      'Step under the bar and rest it across your upper back, not your neck, hands just outside your shoulders.',
      'Stand up to lift it off the rack and take two or three small steps back.',
      'Take a deep breath, brace your core and sit your hips back and down, knees tracking over your toes.',
      'Lower until your thighs are at least parallel to the floor.',
      'Drive up through your whole foot, keeping your chest up, and breathe out at the top.',
    ],
  },

  // Hinge
  'glute-bridge': {
    aliases: ['hip bridge', 'bridge'],
    steps: [
      'Lie on your back with knees bent and feet flat, close enough that your fingertips can touch your heels.',
      'Rest your arms at your sides, palms down.',
      'Squeeze your glutes and push through your heels to lift your hips off the floor.',
      'Stop when your body forms a straight line from shoulders to knees.',
      'Hold for a second, then lower your hips slowly back down.',
    ],
  },
  'single-leg-glute-bridge': {
    aliases: ['one leg bridge', 'single leg bridge'],
    steps: [
      'Lie on your back with knees bent and feet flat on the floor.',
      'Straighten one leg so it points forward, knees level with each other.',
      'Push through the heel of the bent leg to lift your hips until your body is straight from shoulders to knee.',
      'Keep your hips level; don’t let one side drop.',
      'Lower slowly. Finish all reps on one side, then switch.',
    ],
  },
  'dumbbell-romanian-deadlift': {
    aliases: ['rdl', 'dumbbell rdl', 'stiff leg deadlift', 'deadlift'],
    steps: [
      'Stand with feet hip-width apart, holding a dumbbell in each hand in front of your thighs.',
      'Unlock your knees slightly and keep them at that angle the whole time.',
      'Push your hips straight back, letting the dumbbells slide down the front of your legs.',
      'Keep your back flat and lower until you feel a strong stretch in your hamstrings, usually around mid-shin.',
      'Squeeze your glutes and drive your hips forward to stand back up.',
    ],
  },
  'band-good-morning': {
    aliases: ['good morning'],
    steps: [
      'Stand on the band with feet hip-width apart.',
      'Loop the other end of the band behind your neck and across your upper back, holding it at your shoulders.',
      'With a slight bend in your knees, push your hips back and hinge forward with a flat back.',
      'Lower your chest until it is nearly parallel to the floor or until you feel your hamstrings stretch.',
      'Squeeze your glutes to stand back up tall.',
    ],
  },
  'romanian-deadlift': {
    aliases: ['rdl', 'barbell rdl', 'stiff leg deadlift', 'deadlift'],
    steps: [
      'Hold a barbell with an overhand grip just outside your thighs, standing tall with feet hip-width apart.',
      'Unlock your knees slightly and brace your core.',
      'Push your hips back and slide the bar down your thighs, keeping it touching or very close to your legs.',
      'Lower until you feel a strong hamstring stretch, usually just below the knees to mid-shin, with a flat back.',
      'Drive your hips forward to stand back up, squeezing your glutes at the top.',
    ],
  },

  // Lunge
  'split-squat': {
    aliases: ['static lunge', 'lunge'],
    steps: [
      'Stand in a long staggered stance, one foot about two to three feet in front of the other.',
      'Lift your back heel so you are on the ball of that foot.',
      'Keeping your chest up, bend both knees to lower your back knee toward the floor.',
      'Stop just before your back knee touches, with your front shin roughly vertical.',
      'Push through your front foot to rise. Finish all reps, then switch legs.',
    ],
  },
  'bodyweight-reverse-lunge': {
    aliases: ['lunge', 'backward lunge'],
    steps: [
      'Stand tall with your feet hip-width apart.',
      'Take a long step backward with one foot, landing on the ball of that foot.',
      'Bend both knees to lower until your back knee is just above the floor.',
      'Keep your weight mostly on your front foot and your chest up.',
      'Push through your front foot to step back to standing. Alternate legs or finish one side first.',
    ],
  },
  'dumbbell-reverse-lunge': {
    aliases: ['lunge', 'weighted lunge'],
    steps: [
      'Stand tall holding a dumbbell in each hand at your sides.',
      'Take a long step backward with one foot, landing on the ball of that foot.',
      'Bend both knees to lower until your back knee is just above the floor.',
      'Keep the dumbbells hanging straight down and your chest up.',
      'Push through your front foot to return to standing. Alternate legs or finish one side first.',
    ],
  },
  'dumbbell-step-up': {
    aliases: ['step up', 'box step up'],
    steps: [
      'Stand facing a sturdy box, bench or stair, holding a dumbbell in each hand.',
      'Place one whole foot on the step.',
      'Push through the top foot to lift yourself up until that leg is straight; try not to push off the bottom foot.',
      'Bring the other foot up to stand on the step.',
      'Step down slowly with the same foot you brought up last. Finish one side, then switch.',
    ],
  },

  // Horizontal push
  'incline-push-up': {
    aliases: ['incline pushup', 'push up', 'pushup', 'wall push up'],
    steps: [
      'Place your hands slightly wider than shoulder-width on the edge of a counter, bench or sturdy table.',
      'Walk your feet back until your body forms a straight line from head to heels.',
      'Bend your elbows to lower your chest toward the edge, elbows angled about 45 degrees from your body.',
      'Stop when your chest is an inch or two away.',
      'Press back up until your arms are straight. The higher the surface, the easier it gets.',
    ],
  },
  'push-up': {
    aliases: ['pushup', 'press up'],
    steps: [
      'Start in a high plank with hands slightly wider than your shoulders and feet together.',
      'Squeeze your glutes and brace your stomach so your body is a straight line.',
      'Bend your elbows to lower your chest toward the floor, elbows about 45 degrees from your body.',
      'Lower until your chest is just above the floor.',
      'Press the floor away to straighten your arms. Drop to your knees if you can’t keep a straight line.',
    ],
  },
  'dumbbell-floor-press': {
    aliases: ['floor press', 'chest press', 'bench press'],
    steps: [
      'Sit on the floor with a dumbbell on each thigh, then lie back, bringing the dumbbells to your chest.',
      'Bend your knees with feet flat on the floor.',
      'Press the dumbbells straight up over your chest until your arms are straight.',
      'Lower slowly until your upper arms rest lightly on the floor, elbows at about 45 degrees.',
      'Pause briefly, then press back up.',
    ],
  },
  'band-chest-press': {
    aliases: ['chest press', 'band press'],
    steps: [
      'Anchor the band behind you at chest height, such as around a sturdy post or in a door anchor.',
      'Face away from the anchor holding a handle in each hand at chest level, elbows bent.',
      'Step forward into a staggered stance until the band has some tension.',
      'Press your hands straight forward until your arms are fully extended.',
      'Return slowly, keeping tension on the band.',
    ],
  },
  'dumbbell-bench-press': {
    aliases: ['bench press', 'db bench', 'chest press'],
    steps: [
      'Sit on a flat bench with a dumbbell on each thigh, then lie back and bring them to your chest.',
      'Plant your feet on the floor and pull your shoulder blades back and down into the bench.',
      'Press the dumbbells up over your chest until your arms are straight.',
      'Lower them slowly to the sides of your chest, elbows about 45 degrees from your body.',
      'Press back up, bringing the dumbbells slightly toward each other at the top.',
    ],
  },
  'barbell-bench-press': {
    aliases: ['bench press', 'bench', 'chest press'],
    steps: [
      'Lie on the bench with your eyes under the bar and feet flat on the floor. Use a spotter or safety arms.',
      'Grip the bar slightly wider than shoulder-width and pull your shoulder blades back and down.',
      'Unrack the bar and hold it straight over your shoulders with arms locked.',
      'Lower the bar with control to your mid-chest, elbows about 45 to 70 degrees from your body.',
      'Press the bar back up and slightly back toward your shoulders until your arms are straight.',
    ],
  },

  // Vertical push
  'pike-push-up': {
    aliases: ['pike pushup', 'shoulder push up'],
    steps: [
      'Start in a push-up position, then walk your feet toward your hands and lift your hips high into an upside-down V.',
      'Place your hands shoulder-width apart with your head between your arms.',
      'Bend your elbows to lower the top of your head toward the floor just in front of your hands.',
      'Stop just before your head touches.',
      'Press back up to the V. Keep your hips high the whole time.',
    ],
  },
  'dumbbell-shoulder-press': {
    aliases: ['shoulder press', 'overhead press', 'ohp', 'military press'],
    steps: [
      'Sit on a bench with back support or stand with feet hip-width apart.',
      'Hold the dumbbells at shoulder height, palms facing forward, elbows under your wrists.',
      'Brace your core and keep your ribs down.',
      'Press the dumbbells straight overhead until your arms are fully straight.',
      'Lower them slowly back to shoulder height.',
    ],
  },
  'band-overhead-press': {
    aliases: ['shoulder press', 'overhead press'],
    steps: [
      'Stand on the middle of the band with feet shoulder-width apart.',
      'Hold the handles at shoulder height, palms facing forward.',
      'Squeeze your glutes and brace your stomach so you don’t lean back.',
      'Press your hands straight overhead until your arms are locked out.',
      'Lower slowly back to your shoulders.',
    ],
  },
  'barbell-overhead-press': {
    aliases: ['overhead press', 'ohp', 'military press', 'shoulder press', 'strict press'],
    steps: [
      'Set the bar in a rack at upper-chest height and grip it just outside your shoulders.',
      'Unrack it so it rests on the front of your shoulders, elbows slightly in front of the bar.',
      'Squeeze your glutes, brace your core and pull your chin back slightly.',
      'Press the bar straight up, moving your head back so the bar passes your face.',
      'Push your head forward under the bar at the top, then lower it with control to your shoulders.',
    ],
  },

  // Horizontal pull
  'doorway-row': {
    aliases: ['door frame row', 'bodyweight row'],
    steps: [
      'Stand in a sturdy doorway and grip both sides of the frame at chest height.',
      'Walk your feet in close to the frame and lean back until your arms are straight.',
      'Keep your body in a straight line from head to heels.',
      'Pull your chest toward the frame by driving your elbows back past your ribs.',
      'Lower slowly until your arms are straight. Move your feet closer to make it harder.',
    ],
  },
  'inverted-row': {
    aliases: ['bodyweight row', 'australian pull up', 'table row'],
    steps: [
      'Lie under a sturdy table or low bar that will not tip, and grip the edge with hands shoulder-width apart.',
      'Straighten your body so only your heels touch the floor.',
      'Squeeze your glutes and pull your chest up to the edge.',
      'Squeeze your shoulder blades together at the top.',
      'Lower until your arms are straight. Bend your knees to make it easier.',
    ],
  },
  'dumbbell-row': {
    aliases: ['one arm row', 'single arm row', 'db row', 'row'],
    steps: [
      'Place one hand and the same-side knee on a bench or sturdy chair, the other foot on the floor.',
      'Hold a dumbbell in your free hand, arm hanging straight down, back flat.',
      'Pull the dumbbell toward your hip, keeping your elbow close to your body.',
      'Squeeze your shoulder blade toward your spine at the top.',
      'Lower slowly until your arm is straight. Finish all reps, then switch sides.',
    ],
  },
  'band-row': {
    aliases: ['seated band row', 'row'],
    steps: [
      'Anchor the band in front of you at chest height, or sit and loop it around your feet.',
      'Hold a handle in each hand with arms straight and a little tension on the band.',
      'Sit or stand tall with your shoulders down.',
      'Pull your elbows back past your ribs, squeezing your shoulder blades together.',
      'Let your arms straighten slowly.',
    ],
  },
  'seated-cable-row': {
    aliases: ['cable row', 'row'],
    steps: [
      'Sit at the machine with feet on the platform and knees slightly bent.',
      'Grab the handle and sit tall with your arms straight.',
      'Pull the handle toward your belly button, driving your elbows back.',
      'Squeeze your shoulder blades together without leaning far back.',
      'Let your arms straighten slowly, allowing your shoulders to reach forward a little.',
    ],
  },

  // Vertical pull
  'superman-pull': {
    aliases: ['superman', 'prone pull'],
    steps: [
      'Lie face down with your arms stretched straight overhead.',
      'Lift your chest and arms a few inches off the floor, eyes looking at the floor.',
      'Pull your elbows down toward your sides as if doing a pull-up, squeezing your upper back.',
      'Reach your arms back overhead while keeping your chest lifted.',
      'Repeat, then relax your chest to the floor after the last rep.',
    ],
  },
  'dumbbell-pullover': {
    aliases: ['pullover'],
    steps: [
      'Lie on your back on a bench or the floor, holding one dumbbell with both hands by one end.',
      'Start with the dumbbell straight over your chest, elbows slightly bent.',
      'Keeping that elbow bend, lower the dumbbell back behind your head in an arc.',
      'Stop when you feel a stretch through your sides and chest, before your lower back arches.',
      'Pull the dumbbell back over your chest along the same arc.',
    ],
  },
  'band-pulldown': {
    aliases: ['band lat pulldown', 'pulldown', 'pull up alternative'],
    steps: [
      'Anchor the band high, such as over the top of a door or a sturdy bar.',
      'Kneel or stand facing the anchor, holding the ends with arms stretched up and forward.',
      'Pull your elbows down toward your sides, bringing your hands to shoulder height.',
      'Squeeze your back muscles at the bottom.',
      'Let your arms rise slowly back to the start.',
    ],
  },
  'lat-pulldown': {
    aliases: ['pulldown', 'lat pull down', 'pull up alternative'],
    steps: [
      'Adjust the knee pad so your thighs are locked in, then sit down.',
      'Grip the bar a little wider than shoulder-width, palms facing away.',
      'Lean back slightly and lift your chest.',
      'Pull the bar down to your collarbone by driving your elbows down toward your sides.',
      'Let the bar rise slowly until your arms are straight.',
    ],
  },

  // Arms and shoulders
  'dumbbell-curl': {
    aliases: ['bicep curl', 'biceps curl', 'curl'],
    steps: [
      'Stand tall holding a dumbbell in each hand, arms at your sides, palms facing forward.',
      'Keep your elbows pinned to your sides.',
      'Curl the dumbbells up toward your shoulders by bending your elbows.',
      'Squeeze your biceps at the top without letting your elbows drift forward.',
      'Lower slowly until your arms are straight.',
    ],
  },
  'band-curl': {
    aliases: ['bicep curl', 'biceps curl', 'curl'],
    steps: [
      'Stand on the middle of the band with feet hip-width apart.',
      'Hold the ends with arms straight at your sides, palms facing forward.',
      'Keeping your elbows at your sides, curl your hands up toward your shoulders.',
      'Squeeze at the top.',
      'Lower slowly, resisting the band.',
    ],
  },
  'bench-dip': {
    aliases: ['dip', 'chair dip', 'tricep dip', 'triceps dip'],
    steps: [
      'Sit on the edge of a sturdy chair or bench with your hands beside your hips, fingers forward.',
      'Slide your hips off the edge, knees bent and feet flat on the floor.',
      'Bend your elbows straight back to lower your hips toward the floor.',
      'Stop when your elbows reach about 90 degrees, keeping your hips close to the chair.',
      'Press through your palms to straighten your arms. Straighten your legs to make it harder.',
    ],
  },
  'dumbbell-overhead-extension': {
    aliases: ['tricep extension', 'triceps extension', 'overhead extension', 'skull crusher alternative'],
    steps: [
      'Sit or stand holding one dumbbell with both hands under the top end.',
      'Press it straight overhead with your arms close to your ears.',
      'Keeping your upper arms still, bend your elbows to lower the dumbbell behind your head.',
      'Lower until you feel a stretch in the back of your arms.',
      'Straighten your arms to lift it back overhead.',
    ],
  },
  'band-pushdown': {
    aliases: ['tricep pushdown', 'triceps pushdown', 'pushdown'],
    steps: [
      'Anchor the band high, such as over the top of a door.',
      'Hold the ends with elbows bent at about 90 degrees and pinned to your sides.',
      'Push your hands down until your arms are fully straight.',
      'Squeeze the back of your arms at the bottom.',
      'Let your hands come back up slowly, elbows staying at your sides.',
    ],
  },
  'cable-pushdown': {
    aliases: ['tricep pushdown', 'triceps pushdown', 'pushdown'],
    steps: [
      'Attach a rope or straight bar to a high cable and grab it with both hands.',
      'Stand tall with a slight forward lean and elbows pinned to your sides.',
      'Push the handle down until your arms are fully straight.',
      'Squeeze the back of your arms at the bottom.',
      'Let the handle rise slowly until your forearms are about parallel to the floor.',
    ],
  },
  'dumbbell-lateral-raise': {
    aliases: ['lateral raise', 'side raise', 'shoulder raise'],
    steps: [
      'Stand tall with a light dumbbell in each hand at your sides.',
      'Keep a slight bend in your elbows.',
      'Raise your arms out to the sides, leading with your elbows.',
      'Stop at shoulder height, with your hands no higher than your elbows.',
      'Lower slowly back to your sides.',
    ],
  },
  'band-lateral-raise': {
    aliases: ['lateral raise', 'side raise'],
    steps: [
      'Stand on the middle of the band with feet close together.',
      'Hold the ends at your sides with a slight bend in your elbows.',
      'Raise your arms out to the sides up to shoulder height.',
      'Pause briefly at the top.',
      'Lower slowly, resisting the band.',
    ],
  },

  // Core
  plank: {
    aliases: ['front plank', 'forearm plank', 'abs'],
    steps: [
      'Kneel and place your forearms on the floor, elbows directly under your shoulders.',
      'Step your feet back one at a time so you are on your toes.',
      'Squeeze your glutes and brace your stomach so your body is a straight line from head to heels.',
      'Look at the floor just ahead of your hands and breathe steadily.',
      'Hold for the target time. Drop to your knees if your hips start to sag.',
    ],
  },
  'side-plank': {
    aliases: ['side bridge', 'obliques'],
    steps: [
      'Lie on your side with your elbow directly under your shoulder and legs stacked.',
      'Lift your hips so your body forms a straight line from head to feet.',
      'Keep your hips pushed forward, not sagging or sticking back.',
      'Hold for half the target time, breathing steadily.',
      'Switch sides and repeat. Bend your knees to make it easier.',
    ],
  },
  'dead-bug': {
    aliases: ['deadbug', 'abs'],
    steps: [
      'Lie on your back with arms reaching straight up and knees bent at 90 degrees over your hips.',
      'Press your lower back gently into the floor.',
      'Slowly lower your right arm overhead and straighten your left leg toward the floor at the same time.',
      'Stop just above the floor, keeping your lower back down, then return to the start.',
      'Repeat on the other side. Each side counts as one rep.',
    ],
  },
  'bird-dog': {
    aliases: ['birddog', 'abs', 'lower back'],
    steps: [
      'Start on your hands and knees, hands under shoulders and knees under hips.',
      'Brace your stomach so your back stays flat like a table.',
      'Reach your right arm forward and your left leg straight back at the same time.',
      'Pause for a second, keeping your hips level, then return to the start.',
      'Repeat on the other side. Each side counts as one rep.',
    ],
  },
}
