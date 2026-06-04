// ISSA Certified Personal Trainer standard form definitions
// Digitized from ISSA-Personal-Trainer-Forms.zip

export type FieldType = "text" | "textarea" | "radio" | "checkbox" | "date" | "number" | "signature" | "select" | "section";

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
  followUpIf?: string; // show follow-up field when this option is selected
  followUp?: FormField;
  section?: boolean; // acts as a visual section header
}

export interface ISSAFormDef {
  slug: string;
  name: string;
  description: string;
  category: "onboarding" | "ongoing" | "legal" | "screening";
  isClientFacing: boolean;
  isRequired: boolean;
  sortOrder: number;
  fields: FormField[];
}

export const ISSA_FORMS: ISSAFormDef[] = [
  // ─── 1. PAR-Q ──────────────────────────────────────────────────────────────
  {
    slug: "par-q",
    name: "PAR-Q — Physical Activity Readiness Questionnaire",
    description: "A self-administered questionnaire designed to help determine your readiness for increased physical activity. Please answer all questions honestly.",
    category: "onboarding",
    isClientFacing: true,
    isRequired: true,
    sortOrder: 1,
    fields: [
      { id: "s1", label: "PHYSICAL ACTIVITY READINESS", type: "section", description: "Answer YES or NO to each question. If you answer YES to any question, consult your physician before beginning or increasing your physical activity." },
      { id: "q1", label: "Has your doctor ever said that you have a heart condition and that you should only do physical activity recommended by a doctor?", type: "radio", options: ["Yes", "No"], required: true,
        followUpIf: "Yes", followUp: { id: "q1_detail", label: "Please provide details:", type: "textarea", required: true } },
      { id: "q2", label: "Do you feel pain in your chest when you do physical activity?", type: "radio", options: ["Yes", "No"], required: true,
        followUpIf: "Yes", followUp: { id: "q2_detail", label: "Please describe:", type: "textarea", required: true } },
      { id: "q3", label: "In the past month, have you had chest pain when you were NOT doing physical activity?", type: "radio", options: ["Yes", "No"], required: true,
        followUpIf: "Yes", followUp: { id: "q3_detail", label: "Please describe:", type: "textarea", required: true } },
      { id: "q4", label: "Do you lose your balance because of dizziness or do you ever lose consciousness?", type: "radio", options: ["Yes", "No"], required: true,
        followUpIf: "Yes", followUp: { id: "q4_detail", label: "Please describe:", type: "textarea", required: true } },
      { id: "q5", label: "Do you have a bone or joint problem (e.g. back, knee, or hip) that could be made worse by a change in your physical activity?", type: "radio", options: ["Yes", "No"], required: true,
        followUpIf: "Yes", followUp: { id: "q5_detail", label: "Which joint(s) and describe:", type: "textarea", required: true } },
      { id: "q6", label: "Is your doctor currently prescribing drugs (e.g. water pills) for your blood pressure or heart condition?", type: "radio", options: ["Yes", "No"], required: true,
        followUpIf: "Yes", followUp: { id: "q6_detail", label: "Please list medications:", type: "textarea", required: true } },
      { id: "q7", label: "Do you know of any other reason why you should not do physical activity?", type: "radio", options: ["Yes", "No"], required: true,
        followUpIf: "Yes", followUp: { id: "q7_detail", label: "Please explain:", type: "textarea", required: true } },
      { id: "s2", label: "DECLARATION", type: "section" },
      { id: "decl", label: "I have read, understood, and completed this questionnaire. Any questions I had were answered to my full satisfaction.", type: "radio", options: ["I agree"], required: true },
      { id: "sig_name", label: "Full Name", type: "text", required: true },
      { id: "sig_date", label: "Date", type: "date", required: true },
      { id: "signature", label: "Signature (type your full name as signature)", type: "text", required: true, placeholder: "Type full name to sign" },
    ],
  },

  // ─── 2. Screening Questionnaire ─────────────────────────────────────────────
  {
    slug: "screening-questionnaire",
    name: "Initial Screening Questionnaire",
    description: "Help us understand your goals and background so we can create the best program for you.",
    category: "screening",
    isClientFacing: true,
    isRequired: true,
    sortOrder: 2,
    fields: [
      { id: "s_personal", label: "PERSONAL INFORMATION", type: "section" },
      { id: "full_name", label: "Full Name", type: "text", required: true },
      { id: "dob", label: "Date of Birth", type: "date", required: true },
      { id: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Non-binary", "Prefer not to say"], required: true },
      { id: "phone", label: "Phone Number", type: "text", required: true },
      { id: "email", label: "Email Address", type: "text", required: true },
      { id: "occupation", label: "Occupation", type: "text" },
      { id: "s_goals", label: "FITNESS GOALS", type: "section" },
      { id: "primary_goal", label: "Primary Fitness Goal", type: "select", options: ["Weight Loss", "Muscle Gain / Hypertrophy", "Athletic Performance", "General Fitness", "Strength Training", "Flexibility / Mobility", "Sport-Specific Training", "Rehabilitation", "Other"], required: true },
      { id: "other_goal", label: "If Other, please describe:", type: "textarea" },
      { id: "goal_timeline", label: "When do you want to achieve your goal?", type: "select", options: ["1–3 months", "3–6 months", "6–12 months", "12+ months"], required: true },
      { id: "motivation", label: "What motivates you to start training now?", type: "textarea", required: true },
      { id: "s_health", label: "HEALTH OVERVIEW", type: "section" },
      { id: "current_health", label: "How would you rate your current health?", type: "radio", options: ["Excellent", "Good", "Fair", "Poor"], required: true },
      { id: "chronic_conditions", label: "Do you have any chronic health conditions?", type: "radio", options: ["Yes", "No"], required: true,
        followUpIf: "Yes", followUp: { id: "conditions_detail", label: "Please list conditions:", type: "textarea", required: true } },
      { id: "injuries", label: "Do you have any current or recent injuries?", type: "radio", options: ["Yes", "No"], required: true,
        followUpIf: "Yes", followUp: { id: "injuries_detail", label: "Please describe injuries:", type: "textarea", required: true } },
      { id: "s_training", label: "TRAINING PREFERENCES", type: "section" },
      { id: "training_type", label: "Preferred Training Style", type: "select", options: ["In-Person", "Online / Virtual", "Hybrid"], required: true },
      { id: "availability", label: "How many days per week can you train?", type: "select", options: ["1–2 days", "3 days", "4 days", "5 days", "6–7 days"], required: true },
      { id: "session_length", label: "Preferred session length", type: "select", options: ["30 minutes", "45 minutes", "60 minutes", "90 minutes"] },
      { id: "how_found", label: "How did you hear about us?", type: "select", options: ["Referral", "Social Media", "Google Search", "Flyer/Poster", "Word of Mouth", "Other"] },
      { id: "referrer", label: "If referred, who referred you?", type: "text" },
    ],
  },

  // ─── 3. Comprehensive Client Info Sheet ─────────────────────────────────────
  {
    slug: "client-info-sheet",
    name: "Comprehensive Client Information Sheet",
    description: "Complete client profile including physical stats, medical background, and training preferences.",
    category: "onboarding",
    isClientFacing: true,
    isRequired: true,
    sortOrder: 3,
    fields: [
      { id: "s_personal", label: "PERSONAL INFORMATION", type: "section" },
      { id: "full_name", label: "Full Name", type: "text", required: true },
      { id: "dob", label: "Date of Birth", type: "date", required: true },
      { id: "age", label: "Age", type: "number", required: true },
      { id: "gender", label: "Gender", type: "select", options: ["Male", "Female", "Non-binary", "Prefer not to say"], required: true },
      { id: "address", label: "Street Address", type: "text" },
      { id: "city_state_zip", label: "City, State, ZIP", type: "text" },
      { id: "phone_cell", label: "Cell Phone", type: "text", required: true },
      { id: "phone_home", label: "Home Phone", type: "text" },
      { id: "email", label: "Email Address", type: "text", required: true },
      { id: "occupation", label: "Occupation / Employer", type: "text" },
      { id: "s_emergency", label: "EMERGENCY CONTACT", type: "section" },
      { id: "ec_name", label: "Emergency Contact Name", type: "text", required: true },
      { id: "ec_relation", label: "Relationship", type: "text", required: true },
      { id: "ec_phone", label: "Emergency Contact Phone", type: "text", required: true },
      { id: "s_physical", label: "PHYSICAL MEASUREMENTS", type: "section" },
      { id: "height_ft", label: "Height (feet)", type: "number" },
      { id: "height_in", label: "Height (inches)", type: "number" },
      { id: "weight_lbs", label: "Current Weight (lbs)", type: "number" },
      { id: "goal_weight", label: "Goal Weight (lbs)", type: "number" },
      { id: "body_fat", label: "Body Fat % (if known)", type: "number" },
      { id: "s_medical", label: "MEDICAL HISTORY SUMMARY", type: "section" },
      { id: "physician_name", label: "Primary Physician Name", type: "text" },
      { id: "physician_phone", label: "Physician Phone", type: "text" },
      { id: "last_physical", label: "Date of Last Physical Exam", type: "date" },
      { id: "medications", label: "Current Medications (list all)", type: "textarea" },
      { id: "allergies", label: "Known Allergies (food, environmental, medications)", type: "textarea" },
      { id: "conditions_check", label: "Check all that apply:", type: "checkbox",
        options: ["Heart Disease", "High Blood Pressure", "Diabetes (Type 1)", "Diabetes (Type 2)", "Asthma / Respiratory Condition", "Arthritis", "Osteoporosis", "Thyroid Disorder", "High Cholesterol", "Stroke / TIA", "Cancer", "Kidney Disease", "Eating Disorder", "Depression / Anxiety", "Pregnancy (current)", "None of the above"] },
      { id: "surgeries", label: "Surgeries or hospitalizations in the last 5 years:", type: "textarea" },
      { id: "s_lifestyle", label: "LIFESTYLE", type: "section" },
      { id: "sleep_hours", label: "Average hours of sleep per night", type: "number" },
      { id: "stress_level", label: "Current stress level", type: "radio", options: ["Low", "Moderate", "High", "Very High"] },
      { id: "alcohol", label: "Alcohol consumption", type: "select", options: ["None", "1–2 drinks/week", "3–5 drinks/week", "Daily"] },
      { id: "smoking", label: "Do you smoke or use tobacco?", type: "radio", options: ["Yes", "No", "Former smoker"] },
      { id: "water_intake", label: "Daily water intake (oz)", type: "number" },
    ],
  },

  // ─── 4. Health History Questionnaire ────────────────────────────────────────
  {
    slug: "health-history",
    name: "Health History Questionnaire",
    description: "Detailed health history to ensure safe and effective program design. All information is confidential.",
    category: "onboarding",
    isClientFacing: true,
    isRequired: true,
    sortOrder: 4,
    fields: [
      { id: "s_cardio", label: "CARDIOVASCULAR HISTORY", type: "section" },
      { id: "heart_attack", label: "Have you ever had a heart attack?", type: "radio", options: ["Yes", "No"],
        followUpIf: "Yes", followUp: { id: "heart_attack_date", label: "When?", type: "text" } },
      { id: "angina", label: "Do you experience chest pain or angina?", type: "radio", options: ["Yes", "No", "Sometimes"] },
      { id: "irregular_heartbeat", label: "Do you have an irregular heartbeat or arrhythmia?", type: "radio", options: ["Yes", "No"] },
      { id: "murmur", label: "Have you been diagnosed with a heart murmur?", type: "radio", options: ["Yes", "No"] },
      { id: "high_bp", label: "Do you have high blood pressure (hypertension)?", type: "radio", options: ["Yes", "No", "Borderline"],
        followUpIf: "Yes", followUp: { id: "bp_meds", label: "Are you on blood pressure medication?", type: "radio", options: ["Yes", "No"] } },
      { id: "pacemaker", label: "Do you have a pacemaker or other cardiac device?", type: "radio", options: ["Yes", "No"] },
      { id: "s_musculo", label: "MUSCULOSKELETAL HISTORY", type: "section" },
      { id: "back_pain", label: "Do you have chronic back pain?", type: "radio", options: ["Yes", "No", "Occasionally"],
        followUpIf: "Yes", followUp: { id: "back_detail", label: "Describe location and severity:", type: "textarea" } },
      { id: "joint_pain", label: "Do you have joint pain or arthritis?", type: "radio", options: ["Yes", "No"],
        followUpIf: "Yes", followUp: { id: "joint_detail", label: "Which joints?", type: "checkbox", options: ["Neck", "Shoulder (L)", "Shoulder (R)", "Elbow (L)", "Elbow (R)", "Wrist (L)", "Wrist (R)", "Hip (L)", "Hip (R)", "Knee (L)", "Knee (R)", "Ankle (L)", "Ankle (R)"] } },
      { id: "fractures", label: "Have you had any bone fractures in the last 2 years?", type: "radio", options: ["Yes", "No"],
        followUpIf: "Yes", followUp: { id: "fractures_detail", label: "Which bones and when?", type: "textarea" } },
      { id: "recent_surgery", label: "Have you had any orthopedic surgery in the last 12 months?", type: "radio", options: ["Yes", "No"],
        followUpIf: "Yes", followUp: { id: "surgery_detail", label: "Describe procedure and recovery status:", type: "textarea" } },
      { id: "s_other", label: "OTHER CONDITIONS", type: "section" },
      { id: "diabetes_type", label: "Do you have diabetes?", type: "select", options: ["No", "Type 1", "Type 2", "Pre-diabetic"] },
      { id: "asthma", label: "Do you have asthma or exercise-induced asthma?", type: "radio", options: ["Yes", "No"],
        followUpIf: "Yes", followUp: { id: "asthma_inhaler", label: "Do you carry an inhaler?", type: "radio", options: ["Yes", "No"] } },
      { id: "herniated_disc", label: "Have you been diagnosed with a herniated or bulging disc?", type: "radio", options: ["Yes", "No"] },
      { id: "osteoporosis", label: "Have you been diagnosed with osteoporosis or osteopenia?", type: "radio", options: ["Yes", "No"] },
      { id: "pregnancy", label: "Are you currently pregnant or postpartum (within 6 months)?", type: "radio", options: ["Yes", "No"] },
      { id: "other_conditions", label: "List any other medical conditions not mentioned above:", type: "textarea" },
      { id: "s_family", label: "FAMILY MEDICAL HISTORY", type: "section", description: "Check any conditions that affect your immediate family (parents, siblings)" },
      { id: "family_history", label: "Family health history:", type: "checkbox", options: ["Heart Disease (before age 55)", "High Blood Pressure", "Diabetes", "Stroke", "Cancer", "Osteoporosis", "None of the above"] },
      { id: "family_other", label: "Other family health history:", type: "textarea" },
    ],
  },

  // ─── 5. Medical History Questionnaire ───────────────────────────────────────
  {
    slug: "medical-history",
    name: "Medical History Questionnaire",
    description: "Detailed medical background for safe program design. All medical information is kept strictly confidential.",
    category: "onboarding",
    isClientFacing: true,
    isRequired: true,
    sortOrder: 5,
    fields: [
      { id: "s_physician", label: "PHYSICIAN INFORMATION", type: "section" },
      { id: "physician_name", label: "Primary Care Physician Name", type: "text" },
      { id: "physician_address", label: "Physician Address", type: "text" },
      { id: "physician_phone", label: "Physician Phone Number", type: "text" },
      { id: "last_physical", label: "Date of Last Physical Examination", type: "date" },
      { id: "s_current_meds", label: "CURRENT MEDICATIONS", type: "section" },
      { id: "taking_meds", label: "Are you currently taking any prescription medications?", type: "radio", options: ["Yes", "No"],
        followUpIf: "Yes", followUp: { id: "meds_list", label: "List all medications, dosages, and reasons:", type: "textarea", required: true } },
      { id: "otc_meds", label: "Are you taking any over-the-counter medications or supplements?", type: "radio", options: ["Yes", "No"],
        followUpIf: "Yes", followUp: { id: "otc_list", label: "List all OTC medications/supplements:", type: "textarea" } },
      { id: "s_conditions_detail", label: "MEDICAL CONDITIONS CHECKLIST", type: "section", description: "Please check all conditions you have been diagnosed with" },
      { id: "cardio_conditions", label: "Cardiovascular Conditions:", type: "checkbox", options: ["Coronary Artery Disease", "Congestive Heart Failure", "Peripheral Vascular Disease", "Previous Heart Attack", "Angina", "Arrhythmia", "Pacemaker/Defibrillator", "Congenital Heart Defect", "None"] },
      { id: "metabolic_conditions", label: "Metabolic Conditions:", type: "checkbox", options: ["Type 1 Diabetes", "Type 2 Diabetes", "Pre-diabetes", "Hypothyroidism", "Hyperthyroidism", "Obesity", "Metabolic Syndrome", "None"] },
      { id: "pulmonary_conditions", label: "Pulmonary Conditions:", type: "checkbox", options: ["Asthma", "COPD", "Exercise-Induced Bronchospasm", "Emphysema", "None"] },
      { id: "ortho_conditions", label: "Orthopaedic Conditions:", type: "checkbox", options: ["Osteoporosis", "Osteoarthritis", "Rheumatoid Arthritis", "Herniated Disc", "Spinal Stenosis", "Rotator Cuff Tear/Injury", "Knee Ligament Injury (ACL/MCL/PCL)", "Plantar Fasciitis", "None"] },
      { id: "neuro_conditions", label: "Neurological Conditions:", type: "checkbox", options: ["Stroke/TIA", "Multiple Sclerosis", "Parkinson's Disease", "Peripheral Neuropathy", "None"] },
      { id: "s_hospitalizations", label: "HOSPITALIZATIONS & SURGERIES", type: "section" },
      { id: "hospitalizations", label: "List all hospitalizations in the last 5 years (date, reason, outcome):", type: "textarea" },
      { id: "surgeries", label: "List all surgeries in the last 5 years (date, procedure, recovery notes):", type: "textarea" },
      { id: "s_clearance", label: "MEDICAL CLEARANCE", type: "section" },
      { id: "physician_clearance", label: "Have you received physician clearance to begin an exercise program?", type: "radio", options: ["Yes", "No", "Not Required"], required: true },
      { id: "clearance_restrictions", label: "Are there any exercise restrictions from your physician?", type: "radio", options: ["Yes", "No"],
        followUpIf: "Yes", followUp: { id: "restrictions_detail", label: "Please describe restrictions:", type: "textarea", required: true } },
    ],
  },

  // ─── 6. Exercise History Questionnaire ──────────────────────────────────────
  {
    slug: "exercise-history",
    name: "Exercise History Questionnaire",
    description: "Your exercise background helps us design the right program starting point for you.",
    category: "onboarding",
    isClientFacing: true,
    isRequired: false,
    sortOrder: 6,
    fields: [
      { id: "s_current", label: "CURRENT ACTIVITY LEVEL", type: "section" },
      { id: "current_activity", label: "How would you describe your current activity level?", type: "radio", options: ["Sedentary (little to no exercise)", "Lightly Active (1–2 days/week)", "Moderately Active (3–4 days/week)", "Very Active (5+ days/week)", "Athlete (training daily)"], required: true },
      { id: "current_exercise_types", label: "What types of exercise do you currently do?", type: "checkbox", options: ["Weight Training / Resistance Training", "Cardio / Aerobics", "Running / Jogging", "Cycling", "Swimming", "Sports / Team Athletics", "Yoga / Pilates", "Martial Arts / Combat Sports", "CrossFit / HIIT", "None / Just Starting"] },
      { id: "current_weekly_hours", label: "Total hours of exercise per week:", type: "select", options: ["0 hours", "1–2 hours", "3–5 hours", "6–8 hours", "9+ hours"] },
      { id: "s_past", label: "EXERCISE HISTORY", type: "section" },
      { id: "years_training", label: "How many years have you been exercising regularly?", type: "select", options: ["This is my first time", "Less than 1 year", "1–2 years", "3–5 years", "5–10 years", "10+ years"] },
      { id: "formal_program", label: "Have you worked with a personal trainer before?", type: "radio", options: ["Yes", "No"],
        followUpIf: "Yes", followUp: { id: "trainer_experience", label: "Describe your experience:", type: "textarea" } },
      { id: "past_sports", label: "What sports or activities have you participated in?", type: "textarea", placeholder: "e.g. High school football, recreational basketball, marathon running..." },
      { id: "s_fitness_tests", label: "CURRENT FITNESS ASSESSMENT", type: "section", description: "Fill in what you know, leave blank what you don't" },
      { id: "push_ups", label: "Max push-ups (in one set)", type: "number" },
      { id: "pull_ups", label: "Max pull-ups / chin-ups", type: "number" },
      { id: "mile_time", label: "1-mile run time (mm:ss)", type: "text", placeholder: "e.g. 8:30" },
      { id: "bench_1rm", label: "Bench press 1RM (lbs) or estimated", type: "number" },
      { id: "squat_1rm", label: "Squat 1RM (lbs) or estimated", type: "number" },
      { id: "s_preferences", label: "PREFERENCES & LIMITATIONS", type: "section" },
      { id: "favorite_exercises", label: "What exercises or activities do you enjoy?", type: "textarea" },
      { id: "disliked_exercises", label: "What exercises or activities do you dislike or want to avoid?", type: "textarea" },
      { id: "limiting_factors", label: "What are the main obstacles to your fitness goals?", type: "checkbox", options: ["Time", "Motivation", "Injuries / Pain", "Lack of Knowledge", "Access to Equipment", "Finances", "Health Conditions", "Other"] },
      { id: "equipment_access", label: "What equipment do you have access to?", type: "checkbox", options: ["Full Commercial Gym", "Home Gym", "Dumbbells / Resistance Bands", "Barbells / Squat Rack", "Cardio Machines", "Bodyweight Only", "Other"] },
    ],
  },

  // ─── 7. Intake Questionnaire ─────────────────────────────────────────────────
  {
    slug: "intake-questionnaire",
    name: "Client Intake Questionnaire",
    description: "Complete this form to get started. Your answers help us build your personalized program.",
    category: "onboarding",
    isClientFacing: true,
    isRequired: true,
    sortOrder: 7,
    fields: [
      { id: "s_goals", label: "YOUR GOALS", type: "section" },
      { id: "short_term_goal", label: "Short-term goal (next 4–8 weeks):", type: "textarea", required: true },
      { id: "long_term_goal", label: "Long-term goal (3–12 months):", type: "textarea", required: true },
      { id: "why_now", label: "What is the main reason you're starting now?", type: "textarea", required: true },
      { id: "success_definition", label: "How will you know when you've succeeded?", type: "textarea", required: true },
      { id: "s_schedule", label: "SCHEDULE & AVAILABILITY", type: "section" },
      { id: "available_days", label: "Which days are you available to train?", type: "checkbox", options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], required: true },
      { id: "preferred_time", label: "Preferred training time:", type: "select", options: ["Early Morning (5–8am)", "Morning (8–11am)", "Midday (11am–1pm)", "Afternoon (1–5pm)", "Evening (5–8pm)", "Late Evening (8pm+)"] },
      { id: "session_frequency", label: "How many times per week would you like to train?", type: "select", options: ["1x", "2x", "3x", "4x", "5x", "6x"], required: true },
      { id: "s_nutrition", label: "NUTRITION OVERVIEW", type: "section" },
      { id: "diet_type", label: "Current diet style:", type: "select", options: ["Standard / No Restrictions", "Vegetarian", "Vegan", "Keto / Low Carb", "Paleo", "Mediterranean", "Intermittent Fasting", "Other"] },
      { id: "meal_frequency", label: "How many meals do you eat per day?", type: "select", options: ["1–2", "3", "4–5", "6+"] },
      { id: "food_allergies", label: "Food allergies or intolerances:", type: "textarea", placeholder: "e.g. Gluten, Dairy, Nuts, None" },
      { id: "nutrition_goal", label: "Nutrition goal:", type: "select", options: ["Lose Body Fat", "Build Muscle / Gain Mass", "Maintain Current Weight", "Improve Performance", "Improve Overall Health"] },
      { id: "s_commitment", label: "COMMITMENT LEVEL", type: "section" },
      { id: "commitment_scale", label: "On a scale of 1–10, how committed are you to reaching your fitness goals?", type: "radio", options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], required: true },
      { id: "commitment_explanation", label: "Explain your commitment level:", type: "textarea" },
      { id: "investment_level", label: "Are you prepared to invest time, energy, and resources into this program?", type: "radio", options: ["Yes, fully committed", "Yes, with some limitations", "Unsure"], required: true },
      { id: "additional_info", label: "Is there anything else you'd like your trainer to know?", type: "textarea" },
    ],
  },

  // ─── 8. Client Dietary Worksheet ────────────────────────────────────────────
  {
    slug: "dietary-worksheet",
    name: "Client Dietary Worksheet",
    description: "A detailed look at your current eating habits to support your nutrition planning.",
    category: "onboarding",
    isClientFacing: true,
    isRequired: false,
    sortOrder: 8,
    fields: [
      { id: "s_eating_habits", label: "EATING HABITS", type: "section" },
      { id: "breakfast_habit", label: "Do you regularly eat breakfast?", type: "radio", options: ["Yes, every day", "Sometimes", "Rarely", "Never"] },
      { id: "typical_breakfast", label: "Describe your typical breakfast:", type: "textarea" },
      { id: "typical_lunch", label: "Describe your typical lunch:", type: "textarea" },
      { id: "typical_dinner", label: "Describe your typical dinner:", type: "textarea" },
      { id: "typical_snacks", label: "Describe your typical snacks:", type: "textarea" },
      { id: "s_nutrition_detail", label: "NUTRITION DETAILS", type: "section" },
      { id: "daily_calories", label: "Estimated daily calorie intake:", type: "select", options: ["Less than 1,200", "1,200–1,600", "1,600–2,000", "2,000–2,500", "2,500–3,000", "3,000+", "Unsure"] },
      { id: "protein_sources", label: "Primary protein sources:", type: "checkbox", options: ["Chicken", "Beef / Red Meat", "Fish / Seafood", "Eggs", "Protein Shakes / Powder", "Tofu / Tempeh", "Beans / Legumes", "Dairy (Greek yogurt, cottage cheese)"] },
      { id: "carb_preference", label: "Carbohydrate preference:", type: "select", options: ["Low Carb / Keto", "Moderate Carbs", "High Carbs", "No Preference"] },
      { id: "water_daily_oz", label: "How much water do you drink daily?", type: "select", options: ["Less than 32 oz", "32–64 oz (4–8 cups)", "64–96 oz (8–12 cups)", "96+ oz (12+ cups)"] },
      { id: "s_dietary_challenges", label: "DIETARY CHALLENGES", type: "section" },
      { id: "biggest_challenges", label: "What are your biggest nutrition challenges?", type: "checkbox", options: ["Overeating / Portion Control", "Eating Late at Night", "Emotional Eating", "Skipping Meals", "Not Eating Enough Protein", "Too Much Sugar / Processed Food", "Lack of Meal Planning", "Eating Out / Travel", "Other"] },
      { id: "cheat_meals", label: "How often do you have 'cheat meals'?", type: "select", options: ["Daily", "Several times per week", "Once per week", "Rarely", "Never"] },
      { id: "supplements_current", label: "What nutritional supplements do you currently take?", type: "textarea", placeholder: "e.g. Protein powder, Creatine, Multivitamin, Fish Oil..." },
      { id: "dietary_notes", label: "Additional notes about your diet:", type: "textarea" },
    ],
  },

  // ─── 9. 3-Day Food Record ───────────────────────────────────────────────────
  {
    slug: "3-day-food-record",
    name: "3-Day Food & Activity Record",
    description: "Track everything you eat and drink for 3 days. Be as specific as possible with portions. This helps your trainer create an accurate nutrition plan.",
    category: "ongoing",
    isClientFacing: true,
    isRequired: false,
    sortOrder: 9,
    fields: [
      { id: "s_instructions", label: "INSTRUCTIONS", type: "section", description: "Record ALL food and beverages for 3 days (ideally 2 weekdays + 1 weekend day). Include amounts, preparation methods, and brand names when possible." },
      { id: "s_day1", label: "DAY 1", type: "section" },
      { id: "day1_date", label: "Day 1 Date", type: "date" },
      { id: "day1_breakfast", label: "Breakfast (include times, foods, portions)", type: "textarea", placeholder: "7:00am - 2 scrambled eggs, 2 slices whole wheat toast, 1 tbsp butter, 8oz orange juice" },
      { id: "day1_snack1", label: "Morning Snack", type: "textarea" },
      { id: "day1_lunch", label: "Lunch", type: "textarea" },
      { id: "day1_snack2", label: "Afternoon Snack", type: "textarea" },
      { id: "day1_dinner", label: "Dinner", type: "textarea" },
      { id: "day1_snack3", label: "Evening Snack / Other", type: "textarea" },
      { id: "day1_water", label: "Day 1 Total Water (oz)", type: "number" },
      { id: "day1_activity", label: "Day 1 Physical Activity", type: "textarea", placeholder: "e.g. 45 min walk, gym session..." },
      { id: "s_day2", label: "DAY 2", type: "section" },
      { id: "day2_date", label: "Day 2 Date", type: "date" },
      { id: "day2_breakfast", label: "Breakfast", type: "textarea" },
      { id: "day2_snack1", label: "Morning Snack", type: "textarea" },
      { id: "day2_lunch", label: "Lunch", type: "textarea" },
      { id: "day2_snack2", label: "Afternoon Snack", type: "textarea" },
      { id: "day2_dinner", label: "Dinner", type: "textarea" },
      { id: "day2_snack3", label: "Evening Snack / Other", type: "textarea" },
      { id: "day2_water", label: "Day 2 Total Water (oz)", type: "number" },
      { id: "day2_activity", label: "Day 2 Physical Activity", type: "textarea" },
      { id: "s_day3", label: "DAY 3", type: "section" },
      { id: "day3_date", label: "Day 3 Date", type: "date" },
      { id: "day3_breakfast", label: "Breakfast", type: "textarea" },
      { id: "day3_snack1", label: "Morning Snack", type: "textarea" },
      { id: "day3_lunch", label: "Lunch", type: "textarea" },
      { id: "day3_snack2", label: "Afternoon Snack", type: "textarea" },
      { id: "day3_dinner", label: "Dinner", type: "textarea" },
      { id: "day3_snack3", label: "Evening Snack / Other", type: "textarea" },
      { id: "day3_water", label: "Day 3 Total Water (oz)", type: "number" },
      { id: "day3_activity", label: "Day 3 Physical Activity", type: "textarea" },
      { id: "s_notes", label: "ADDITIONAL NOTES", type: "section" },
      { id: "record_notes", label: "Anything unusual about these 3 days compared to your normal eating?", type: "textarea" },
    ],
  },

  // ─── 10. Informed Consent ────────────────────────────────────────────────────
  {
    slug: "informed-consent",
    name: "Informed Consent & Assumption of Risk",
    description: "Please read carefully before signing. This form outlines the nature of personal training and your voluntary agreement to participate.",
    category: "legal",
    isClientFacing: true,
    isRequired: true,
    sortOrder: 10,
    fields: [
      { id: "s_consent_text", label: "INFORMED CONSENT AGREEMENT", type: "section",
        description: `I, the undersigned, hereby consent to voluntarily engage in a personal fitness training program with W.A.R. Coaching (hereinafter "Trainer").

NATURE OF PROGRAM: I understand that the personal training program may include cardiovascular exercise, resistance training, flexibility training, and nutritional guidance. The specific activities will be determined based on my fitness assessment and goals.

RISKS: I understand that exercise carries inherent risks including, but not limited to: muscle soreness, physical fatigue, injury to muscles/joints/ligaments, cardiovascular events, and in rare cases, serious injury or death. I voluntarily assume all risks associated with participation in the training program.

HEALTH REPRESENTATION: I represent that I am in good health and have no medical condition that would prevent my participation in a fitness program, or that I have consulted with a physician who has cleared me for exercise.

TRAINER QUALIFICATIONS: I understand that my trainer holds ISSA Certified Personal Trainer (CPT) certification and is qualified to design and supervise exercise programs but is not a licensed medical professional.

EMERGENCY PROCEDURES: In the event of an emergency, I authorize the trainer to call emergency services and administer basic first aid.` },
      { id: "consent_understand", label: "I have read and understand the above consent agreement.", type: "radio", options: ["Yes, I understand and agree"], required: true },
      { id: "s_liability", label: "RELEASE OF LIABILITY", type: "section",
        description: "In consideration of the services provided by W.A.R. Coaching, I hereby release and forever discharge the trainer, their agents, employees, and representatives from any claims, demands, or actions arising from my participation in the personal training program, except in cases of gross negligence or willful misconduct." },
      { id: "liability_agree", label: "I agree to the release of liability as stated above.", type: "radio", options: ["Yes, I agree"], required: true },
      { id: "s_photo", label: "PHOTO & MEDIA RELEASE", type: "section" },
      { id: "photo_consent", label: "Do you consent to photographs and videos being taken during sessions for training/marketing purposes?", type: "radio", options: ["Yes, I consent to photos/videos", "No, I do not consent"], required: true },
      { id: "s_signature", label: "SIGNATURE", type: "section" },
      { id: "sig_name", label: "Full Legal Name", type: "text", required: true },
      { id: "sig_date", label: "Date", type: "date", required: true },
      { id: "signature", label: "Digital Signature (type full name)", type: "text", required: true, placeholder: "Type your full legal name as your signature" },
      { id: "sig_age_confirm", label: "I confirm that I am 18 years of age or older.", type: "radio", options: ["Yes, I am 18 or older"], required: true },
    ],
  },

  // ─── 11. Confidentiality Agreement ─────────────────────────────────────────
  {
    slug: "confidentiality-agreement",
    name: "Confidentiality Agreement",
    description: "This agreement outlines how your personal health information is protected and kept confidential.",
    category: "legal",
    isClientFacing: true,
    isRequired: true,
    sortOrder: 11,
    fields: [
      { id: "s_conf_text", label: "CONFIDENTIALITY AGREEMENT", type: "section",
        description: `W.A.R. Coaching is committed to protecting the privacy and confidentiality of all client information.

INFORMATION COLLECTED: We collect personal information including but not limited to: name, contact information, date of birth, medical history, health conditions, medications, fitness assessments, progress photos, and training records.

HOW WE USE YOUR INFORMATION: Your information is used solely for the purpose of designing and delivering your personal training program. Information will not be shared with third parties except as required by law or as necessary to provide services (e.g., referral to medical professionals).

DATA SECURITY: All client records are stored securely. Digital records are protected with appropriate security measures. Paper records are stored in locked files.

YOUR RIGHTS: You have the right to review your records, request corrections, and request deletion of your data at any time (subject to legal requirements).

DURATION: This agreement remains in effect throughout your training relationship and for 7 years following the end of services.` },
      { id: "conf_understand", label: "I have read and understand the Confidentiality Agreement.", type: "radio", options: ["Yes, I understand"], required: true },
      { id: "conf_agree", label: "I agree to the terms of this Confidentiality Agreement.", type: "radio", options: ["Yes, I agree"], required: true },
      { id: "sig_name", label: "Full Legal Name", type: "text", required: true },
      { id: "sig_date", label: "Date", type: "date", required: true },
      { id: "signature", label: "Digital Signature (type full name)", type: "text", required: true, placeholder: "Type your full legal name as your signature" },
    ],
  },

  // ─── 12. Medical Release Form ────────────────────────────────────────────────
  {
    slug: "medical-release",
    name: "Medical Release / Physician Clearance",
    description: "If required, this form is completed by your physician to confirm clearance for exercise participation.",
    category: "legal",
    isClientFacing: true,
    isRequired: false,
    sortOrder: 12,
    fields: [
      { id: "s_client", label: "CLIENT INFORMATION", type: "section" },
      { id: "client_name", label: "Client Full Name", type: "text", required: true },
      { id: "client_dob", label: "Date of Birth", type: "date", required: true },
      { id: "s_physician_info", label: "PHYSICIAN INFORMATION", type: "section" },
      { id: "physician_name", label: "Physician Full Name", type: "text", required: true },
      { id: "physician_address", label: "Practice Address", type: "text" },
      { id: "physician_phone", label: "Physician Phone", type: "text", required: true },
      { id: "s_clearance", label: "MEDICAL CLEARANCE", type: "section" },
      { id: "cleared_for_exercise", label: "This patient is cleared for participation in a supervised exercise program:", type: "radio", options: ["Cleared without restrictions", "Cleared with restrictions (see below)", "Not cleared — do not exercise at this time"], required: true },
      { id: "restrictions_detail", label: "Exercise restrictions (if any):", type: "textarea" },
      { id: "conditions_to_monitor", label: "Medical conditions the trainer should be aware of:", type: "textarea" },
      { id: "emergency_medications", label: "Emergency medications the client carries (e.g., EpiPen, nitroglycerin):", type: "textarea" },
      { id: "max_heart_rate", label: "Maximum recommended heart rate (bpm) — if applicable:", type: "number" },
      { id: "clearance_date", label: "Date of Clearance", type: "date", required: true },
      { id: "physician_signature", label: "Physician Signature (type full name)", type: "text", required: true, placeholder: "Physician's full name" },
    ],
  },
];

export function getFormBySlug(slug: string): ISSAFormDef | undefined {
  return ISSA_FORMS.find(f => f.slug === slug);
}
