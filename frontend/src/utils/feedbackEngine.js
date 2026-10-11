/**
 * Personalized Drawing Feedback Engine
 * Analyzes predictions against practice targets, identifies confusion patterns,
 * and generates helpful drawing guidance without overpromising results.
 */

// Domain confusion pairs & heuristic suggestions
const CONFUSION_KNOWLEDGE = {
  // Digit confusions
  '0_6': 'Digit 0 and 6 both have large curved outer loops. If the top stem curves downward too far, 0 may activate 6.',
  '6_0': 'If the bottom loop of 6 is overly rounded and the top stem is truncated, the network may identify it as 0.',
  '1_7': 'A 7 without a pronounced horizontal top bar or slant strongly resembles a vertical stroke for digit 1.',
  '7_1': 'If digit 1 has a large decorative serif at the top, it can be mistaken for the horizontal bar of 7.',
  '3_5': 'Digit 3 and 5 both have curved lower halves. If the top flag of 5 is curved rather than straight, it triggers digit 3.',
  '5_3': 'If the top horizontal bar and vertical neck of 5 soften into a curve, 3 is often the top alternative.',
  '4_9': 'Digit 4 with an enclosed top triangle closely mirrors the top loop and vertical stem of 9.',
  '9_4': 'An open or flat-topped 9 can activate features associated with the open prong of 4.',
  '8_0': 'An 8 whose central intersection is faint or wide can look like an oblong 0.',
  '2_7': 'A 2 with an underdeveloped base stroke can be confused with the angular crook of 7.',

  // Doodle confusions
  'cat_car': 'Cats drawn with horizontal oval bodies and small appendages can share contour silhouettes with cars.',
  'car_house': 'A boxy car without distinct circular wheels can be classified as a small house or building.',
  'house_tree': 'A steep triangular roof on a rectangular base shares vertical aspect ratios with an upright pine tree.',
  'tree_flower': 'Both trees and flowers consist of a central vertical stem with a rounded canopy or blossom.',
  'flower_tree': 'If petals are drawn as a continuous cloud rather than distinct circles, the model sees a tree canopy.'
};

const TARGET_DRAWING_TIPS = {
  '0': ['Keep the loop smoothly rounded and fully closed.', 'Avoid dipping the top inwards like an open 6.'],
  '1': ['A single clean vertical stroke is ideal.', 'Avoid exaggerated bottom serifs or wide top diagonal bars.'],
  '2': ['Emphasize the curved upper hook followed by a crisp horizontal base.', 'Keep the bottom stroke flat and distinct.'],
  '3': ['Form two distinct balanced rounded lobes with a clear indent at the midpoint.', 'Do not close either loop.'],
  '4': ['Make the vertical drop and horizontal crossbar crisp, with a clear vertical intersecting stroke.', 'Keep the top open or triangular.'],
  '5': ['Start with a flat top bar, a short vertical neck, and a round open bottom crescent.', 'Keep the top bar straight rather than curved.'],
  '6': ['Maintain a tall, curving ascender and a firmly closed circular bottom loop.', 'Make sure the bottom loop seals completely.'],
  '7': ['Draw a clear, straight horizontal top bar with a deliberate diagonal downward stroke.', 'A slight horizontal cross-bar can help eliminate ambiguity.'],
  '8': ['Draw two balanced loops meeting at a clean intersection.', 'Ensure both loops are visibly closed.'],
  '9': ['Form a round upper loop on the left and a straight or slightly curved vertical stem on the right.', 'Keep the upper loop neatly closed.'],
  
  'cat': ['Include two pointed triangular ears on top of the head.', 'Add 2-3 whisker lines on each cheek to strongly separate from generic shapes.'],
  'car': ['Draw a rectangular body with a raised cabin/roof.', 'Place two clearly separated circular wheels at the bottom.'],
  'house': ['Combine a triangular roof sitting atop a rectangular base.', 'Adding a central door or square window significantly boosts recognition confidence.'],
  'tree': ['Draw a sturdy vertical trunk at the bottom.', 'Place a rounded canopy or layered triangular pine foliage on top.'],
  'flower': ['Draw a distinct central circle surrounded by 4 to 6 discrete petals.', 'Add a downward vertical stem from the blossom.']
};

export function analyzeDrawingFeedback(target, predictionResult, canvasBox) {
  if (!target || !predictionResult || !predictionResult.topPrediction) {
    return null;
  }

  const top = predictionResult.topPrediction;
  const isMatch = String(top.label).toLowerCase() === String(target).toLowerCase();
  const confidence = top.confidence;
  const topAlt = predictionResult.top3.find(p => String(p.label).toLowerCase() !== String(target).toLowerCase());

  let status = 'excellent';
  let title = 'Excellent Match!';
  let explanation = '';

  if (isMatch && confidence >= 0.80) {
    status = 'excellent';
    title = `Spot On! Recognized as "${target}"`;
    explanation = `The model identified your drawing as "${target}" with a high confidence of ${Math.round(confidence * 100)}%. The structural strokes align closely with the training distribution.`;
  } else if (isMatch && confidence < 0.80) {
    status = 'good';
    title = `Target Matched with Moderate Confidence`;
    explanation = `The model recognized your target "${target}" (${Math.round(confidence * 100)}%), but noticed subtle feature overlap with "${topAlt ? topAlt.label : 'other classes'}".`;
  } else {
    // Mismatch
    status = 'confused';
    title = `Identified as "${top.label}" Instead of "${target}"`;
    const confusionKey = `${target}_${top.label}`.toLowerCase();
    const reverseKey = `${top.label}_${target}`.toLowerCase();

    if (CONFUSION_KNOWLEDGE[confusionKey]) {
      explanation = CONFUSION_KNOWLEDGE[confusionKey];
    } else if (CONFUSION_KNOWLEDGE[reverseKey]) {
      explanation = CONFUSION_KNOWLEDGE[reverseKey];
    } else {
      explanation = `The model detected stroke distributions closer to "${top.label}" (${Math.round(confidence * 100)}% confidence). Minor structural cues can lead neural networks to favor adjacent clusters.`;
    }
  }

  const tips = TARGET_DRAWING_TIPS[String(target).toLowerCase()] || [
    'Draw with continuous, deliberate strokes.',
    'Keep key distinguishing features prominent.'
  ];

  return {
    target,
    predictedLabel: top.label,
    isMatch,
    confidence,
    status,
    title,
    explanation,
    topAlternative: topAlt ? { label: topAlt.label, confidence: topAlt.confidence } : null,
    suggestions: tips,
    disclaimer: 'Note: Machine learning predictions reflect statistical feature alignment on training data; following these drawing cues helps reinforce standard patterns, but varied stroke styles may still produce different confidence scores.'
  };
}
