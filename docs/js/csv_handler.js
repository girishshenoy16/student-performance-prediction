const REQUIRED_COLUMNS = [
  "Hours_Studied", "Attendance", "Parental_Involvement", "Access_to_Resources",
  "Extracurricular_Activities", "Sleep_Hours", "Previous_Scores",
  "Motivation_Level", "Internet_Access", "Tutoring_Sessions", "Family_Income",
  "Teacher_Quality", "School_Type", "Peer_Influence", "Physical_Activity",
  "Learning_Disabilities", "Parental_Education_Level", "Distance_from_Home", "Gender"
];

const BATCH_PAGE_SIZE = 15;
let batchState = {
  phase: "idle",
  fileName: "",
  originalHeaders: [],
  rawRows: [],
  predictions: [],
  currentPage: 1,
  totalPages: 1,
};

const BATCH_SCENARIOS = {
  full_dataset: [
    { Hours_Studied: 28, Attendance: 92, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 8, Previous_Scores: 85, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 3, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 4, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Female" },
    { Hours_Studied: 22, Attendance: 88, Parental_Involvement: "Medium", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 7, Previous_Scores: 78, Motivation_Level: "Medium", Internet_Access: "Yes", Tutoring_Sessions: 2, Family_Income: "Medium", Teacher_Quality: "High", School_Type: "Public", Peer_Influence: "Positive", Physical_Activity: 3, Learning_Disabilities: "No", Parental_Education_Level: "College", Distance_from_Home: "Near", Gender: "Male" },
    { Hours_Studied: 35, Attendance: 96, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 7, Previous_Scores: 92, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 4, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 5, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Female" },
    { Hours_Studied: 18, Attendance: 78, Parental_Involvement: "Medium", Access_to_Resources: "Medium", Extracurricular_Activities: "No", Sleep_Hours: 6, Previous_Scores: 72, Motivation_Level: "Medium", Internet_Access: "Yes", Tutoring_Sessions: 1, Family_Income: "Medium", Teacher_Quality: "Medium", School_Type: "Public", Peer_Influence: "Neutral", Physical_Activity: 2, Learning_Disabilities: "No", Parental_Education_Level: "College", Distance_from_Home: "Moderate", Gender: "Male" },
    { Hours_Studied: 12, Attendance: 70, Parental_Involvement: "Low", Access_to_Resources: "Low", Extracurricular_Activities: "No", Sleep_Hours: 5, Previous_Scores: 60, Motivation_Level: "Low", Internet_Access: "No", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Low", School_Type: "Public", Peer_Influence: "Negative", Physical_Activity: 1, Learning_Disabilities: "Yes", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Male" },
    { Hours_Studied: 25, Attendance: 90, Parental_Involvement: "High", Access_to_Resources: "Medium", Extracurricular_Activities: "Yes", Sleep_Hours: 7, Previous_Scores: 80, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 2, Family_Income: "Medium", Teacher_Quality: "Medium", School_Type: "Public", Peer_Influence: "Positive", Physical_Activity: 3, Learning_Disabilities: "No", Parental_Education_Level: "College", Distance_from_Home: "Near", Gender: "Female" },
    { Hours_Studied: 8, Attendance: 62, Parental_Involvement: "Low", Access_to_Resources: "Low", Extracurricular_Activities: "No", Sleep_Hours: 5, Previous_Scores: 55, Motivation_Level: "Low", Internet_Access: "No", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Low", School_Type: "Public", Peer_Influence: "Negative", Physical_Activity: 1, Learning_Disabilities: "Yes", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Female" },
    { Hours_Studied: 30, Attendance: 94, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 8, Previous_Scores: 88, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 3, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 4, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Male" },
    { Hours_Studied: 20, Attendance: 82, Parental_Involvement: "Medium", Access_to_Resources: "Medium", Extracurricular_Activities: "No", Sleep_Hours: 7, Previous_Scores: 74, Motivation_Level: "Medium", Internet_Access: "Yes", Tutoring_Sessions: 1, Family_Income: "Medium", Teacher_Quality: "Medium", School_Type: "Public", Peer_Influence: "Neutral", Physical_Activity: 2, Learning_Disabilities: "No", Parental_Education_Level: "College", Distance_from_Home: "Moderate", Gender: "Female" },
    { Hours_Studied: 15, Attendance: 75, Parental_Involvement: "Low", Access_to_Resources: "Medium", Extracurricular_Activities: "No", Sleep_Hours: 6, Previous_Scores: 65, Motivation_Level: "Low", Internet_Access: "Yes", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Medium", School_Type: "Public", Peer_Influence: "Neutral", Physical_Activity: 1, Learning_Disabilities: "No", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Male" },
    { Hours_Studied: 32, Attendance: 95, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 7, Previous_Scores: 90, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 4, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 5, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Female" },
    { Hours_Studied: 24, Attendance: 86, Parental_Involvement: "Medium", Access_to_Resources: "Medium", Extracurricular_Activities: "Yes", Sleep_Hours: 7, Previous_Scores: 76, Motivation_Level: "Medium", Internet_Access: "Yes", Tutoring_Sessions: 2, Family_Income: "Medium", Teacher_Quality: "Medium", School_Type: "Public", Peer_Influence: "Positive", Physical_Activity: 3, Learning_Disabilities: "No", Parental_Education_Level: "College", Distance_from_Home: "Near", Gender: "Male" },
    { Hours_Studied: 10, Attendance: 68, Parental_Involvement: "Low", Access_to_Resources: "Low", Extracurricular_Activities: "No", Sleep_Hours: 5, Previous_Scores: 58, Motivation_Level: "Low", Internet_Access: "No", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Low", School_Type: "Public", Peer_Influence: "Negative", Physical_Activity: 1, Learning_Disabilities: "Yes", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Male" },
    { Hours_Studied: 27, Attendance: 91, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 8, Previous_Scores: 82, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 3, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 4, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Female" },
    { Hours_Studied: 16, Attendance: 76, Parental_Involvement: "Medium", Access_to_Resources: "Medium", Extracurricular_Activities: "No", Sleep_Hours: 6, Previous_Scores: 68, Motivation_Level: "Medium", Internet_Access: "Yes", Tutoring_Sessions: 1, Family_Income: "Medium", Teacher_Quality: "Medium", School_Type: "Public", Peer_Influence: "Neutral", Physical_Activity: 2, Learning_Disabilities: "No", Parental_Education_Level: "College", Distance_from_Home: "Moderate", Gender: "Male" },
    { Hours_Studied: 33, Attendance: 97, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 8, Previous_Scores: 94, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 5, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 5, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Male" },
    { Hours_Studied: 14, Attendance: 72, Parental_Involvement: "Low", Access_to_Resources: "Medium", Extracurricular_Activities: "No", Sleep_Hours: 6, Previous_Scores: 62, Motivation_Level: "Low", Internet_Access: "Yes", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Medium", School_Type: "Public", Peer_Influence: "Neutral", Physical_Activity: 1, Learning_Disabilities: "No", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Female" },
    { Hours_Studied: 26, Attendance: 89, Parental_Involvement: "Medium", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 7, Previous_Scores: 81, Motivation_Level: "Medium", Internet_Access: "Yes", Tutoring_Sessions: 2, Family_Income: "Medium", Teacher_Quality: "High", School_Type: "Public", Peer_Influence: "Positive", Physical_Activity: 3, Learning_Disabilities: "No", Parental_Education_Level: "College", Distance_from_Home: "Near", Gender: "Female" },
    { Hours_Studied: 19, Attendance: 80, Parental_Involvement: "Medium", Access_to_Resources: "Medium", Extracurricular_Activities: "No", Sleep_Hours: 7, Previous_Scores: 70, Motivation_Level: "Medium", Internet_Access: "Yes", Tutoring_Sessions: 1, Family_Income: "Medium", Teacher_Quality: "Medium", School_Type: "Public", Peer_Influence: "Neutral", Physical_Activity: 2, Learning_Disabilities: "No", Parental_Education_Level: "College", Distance_from_Home: "Moderate", Gender: "Male" },
    { Hours_Studied: 21, Attendance: 84, Parental_Involvement: "Medium", Access_to_Resources: "Medium", Extracurricular_Activities: "Yes", Sleep_Hours: 7, Previous_Scores: 75, Motivation_Level: "Medium", Internet_Access: "Yes", Tutoring_Sessions: 2, Family_Income: "Medium", Teacher_Quality: "Medium", School_Type: "Public", Peer_Influence: "Positive", Physical_Activity: 3, Learning_Disabilities: "No", Parental_Education_Level: "College", Distance_from_Home: "Near", Gender: "Female" },
  ],
  at_risk_cohort: [
    { Hours_Studied: 8, Attendance: 62, Parental_Involvement: "Low", Access_to_Resources: "Low", Extracurricular_Activities: "No", Sleep_Hours: 5, Previous_Scores: 55, Motivation_Level: "Low", Internet_Access: "No", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Low", School_Type: "Public", Peer_Influence: "Negative", Physical_Activity: 1, Learning_Disabilities: "Yes", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Male" },
    { Hours_Studied: 10, Attendance: 65, Parental_Involvement: "Low", Access_to_Resources: "Low", Extracurricular_Activities: "No", Sleep_Hours: 5, Previous_Scores: 58, Motivation_Level: "Low", Internet_Access: "No", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Low", School_Type: "Public", Peer_Influence: "Negative", Physical_Activity: 1, Learning_Disabilities: "Yes", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Female" },
    { Hours_Studied: 12, Attendance: 68, Parental_Involvement: "Low", Access_to_Resources: "Low", Extracurricular_Activities: "No", Sleep_Hours: 5, Previous_Scores: 60, Motivation_Level: "Low", Internet_Access: "No", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Low", School_Type: "Public", Peer_Influence: "Negative", Physical_Activity: 1, Learning_Disabilities: "Yes", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Male" },
    { Hours_Studied: 9, Attendance: 63, Parental_Involvement: "Low", Access_to_Resources: "Low", Extracurricular_Activities: "No", Sleep_Hours: 4, Previous_Scores: 52, Motivation_Level: "Low", Internet_Access: "No", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Low", School_Type: "Public", Peer_Influence: "Negative", Physical_Activity: 0, Learning_Disabilities: "Yes", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Female" },
    { Hours_Studied: 11, Attendance: 66, Parental_Involvement: "Low", Access_to_Resources: "Low", Extracurricular_Activities: "No", Sleep_Hours: 5, Previous_Scores: 56, Motivation_Level: "Low", Internet_Access: "No", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Low", School_Type: "Public", Peer_Influence: "Negative", Physical_Activity: 1, Learning_Disabilities: "No", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Male" },
    { Hours_Studied: 7, Attendance: 60, Parental_Involvement: "Low", Access_to_Resources: "Low", Extracurricular_Activities: "No", Sleep_Hours: 4, Previous_Scores: 50, Motivation_Level: "Low", Internet_Access: "No", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Low", School_Type: "Public", Peer_Influence: "Negative", Physical_Activity: 0, Learning_Disabilities: "Yes", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Male" },
    { Hours_Studied: 13, Attendance: 69, Parental_Involvement: "Low", Access_to_Resources: "Low", Extracurricular_Activities: "No", Sleep_Hours: 5, Previous_Scores: 61, Motivation_Level: "Low", Internet_Access: "No", Tutoring_Sessions: 1, Family_Income: "Low", Teacher_Quality: "Low", School_Type: "Public", Peer_Influence: "Negative", Physical_Activity: 1, Learning_Disabilities: "No", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Female" },
    { Hours_Studied: 10, Attendance: 64, Parental_Involvement: "Low", Access_to_Resources: "Low", Extracurricular_Activities: "No", Sleep_Hours: 5, Previous_Scores: 54, Motivation_Level: "Low", Internet_Access: "No", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Low", School_Type: "Public", Peer_Influence: "Negative", Physical_Activity: 0, Learning_Disabilities: "Yes", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Male" },
  ],
  high_performer_cohort: [
    { Hours_Studied: 30, Attendance: 95, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 8, Previous_Scores: 88, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 3, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 4, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Female" },
    { Hours_Studied: 35, Attendance: 97, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 8, Previous_Scores: 92, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 4, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 5, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Male" },
    { Hours_Studied: 28, Attendance: 93, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 7, Previous_Scores: 85, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 3, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 4, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Female" },
    { Hours_Studied: 32, Attendance: 96, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 8, Previous_Scores: 90, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 4, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 5, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Male" },
    { Hours_Studied: 26, Attendance: 92, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 7, Previous_Scores: 84, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 3, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 3, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Female" },
    { Hours_Studied: 34, Attendance: 98, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 8, Previous_Scores: 94, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 5, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 5, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Male" },
    { Hours_Studied: 29, Attendance: 94, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 7, Previous_Scores: 87, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 3, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 4, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Female" },
    { Hours_Studied: 31, Attendance: 95, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 8, Previous_Scores: 89, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 4, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 4, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Male" },
  ],
  mixed_cohort: [
    { Hours_Studied: 32, Attendance: 96, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 8, Previous_Scores: 91, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 4, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 5, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Female" },
    { Hours_Studied: 28, Attendance: 93, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 7, Previous_Scores: 86, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 3, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 4, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Male" },
    { Hours_Studied: 22, Attendance: 85, Parental_Involvement: "Medium", Access_to_Resources: "Medium", Extracurricular_Activities: "Yes", Sleep_Hours: 7, Previous_Scores: 78, Motivation_Level: "Medium", Internet_Access: "Yes", Tutoring_Sessions: 2, Family_Income: "Medium", Teacher_Quality: "Medium", School_Type: "Public", Peer_Influence: "Positive", Physical_Activity: 3, Learning_Disabilities: "No", Parental_Education_Level: "College", Distance_from_Home: "Near", Gender: "Female" },
    { Hours_Studied: 20, Attendance: 82, Parental_Involvement: "Medium", Access_to_Resources: "Medium", Extracurricular_Activities: "No", Sleep_Hours: 7, Previous_Scores: 75, Motivation_Level: "Medium", Internet_Access: "Yes", Tutoring_Sessions: 1, Family_Income: "Medium", Teacher_Quality: "Medium", School_Type: "Public", Peer_Influence: "Neutral", Physical_Activity: 2, Learning_Disabilities: "No", Parental_Education_Level: "College", Distance_from_Home: "Moderate", Gender: "Male" },
    { Hours_Studied: 18, Attendance: 78, Parental_Involvement: "Medium", Access_to_Resources: "Medium", Extracurricular_Activities: "No", Sleep_Hours: 6, Previous_Scores: 72, Motivation_Level: "Medium", Internet_Access: "Yes", Tutoring_Sessions: 1, Family_Income: "Medium", Teacher_Quality: "Medium", School_Type: "Public", Peer_Influence: "Neutral", Physical_Activity: 2, Learning_Disabilities: "No", Parental_Education_Level: "College", Distance_from_Home: "Moderate", Gender: "Female" },
    { Hours_Studied: 15, Attendance: 74, Parental_Involvement: "Low", Access_to_Resources: "Medium", Extracurricular_Activities: "No", Sleep_Hours: 6, Previous_Scores: 66, Motivation_Level: "Low", Internet_Access: "Yes", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Medium", School_Type: "Public", Peer_Influence: "Neutral", Physical_Activity: 1, Learning_Disabilities: "No", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Male" },
    { Hours_Studied: 12, Attendance: 70, Parental_Involvement: "Low", Access_to_Resources: "Low", Extracurricular_Activities: "No", Sleep_Hours: 5, Previous_Scores: 62, Motivation_Level: "Low", Internet_Access: "No", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Low", School_Type: "Public", Peer_Influence: "Negative", Physical_Activity: 1, Learning_Disabilities: "Yes", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Female" },
    { Hours_Studied: 10, Attendance: 66, Parental_Involvement: "Low", Access_to_Resources: "Low", Extracurricular_Activities: "No", Sleep_Hours: 5, Previous_Scores: 58, Motivation_Level: "Low", Internet_Access: "No", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Low", School_Type: "Public", Peer_Influence: "Negative", Physical_Activity: 1, Learning_Disabilities: "Yes", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Male" },
    { Hours_Studied: 25, Attendance: 90, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 8, Previous_Scores: 82, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 3, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 3, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Male" },
    { Hours_Studied: 19, Attendance: 80, Parental_Involvement: "Medium", Access_to_Resources: "Medium", Extracurricular_Activities: "No", Sleep_Hours: 7, Previous_Scores: 73, Motivation_Level: "Medium", Internet_Access: "Yes", Tutoring_Sessions: 1, Family_Income: "Medium", Teacher_Quality: "Medium", School_Type: "Public", Peer_Influence: "Neutral", Physical_Activity: 2, Learning_Disabilities: "No", Parental_Education_Level: "College", Distance_from_Home: "Moderate", Gender: "Female" },
    { Hours_Studied: 8, Attendance: 62, Parental_Involvement: "Low", Access_to_Resources: "Low", Extracurricular_Activities: "No", Sleep_Hours: 4, Previous_Scores: 52, Motivation_Level: "Low", Internet_Access: "No", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Low", School_Type: "Public", Peer_Influence: "Negative", Physical_Activity: 0, Learning_Disabilities: "Yes", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Male" },
    { Hours_Studied: 24, Attendance: 88, Parental_Involvement: "Medium", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 7, Previous_Scores: 80, Motivation_Level: "Medium", Internet_Access: "Yes", Tutoring_Sessions: 2, Family_Income: "Medium", Teacher_Quality: "High", School_Type: "Public", Peer_Influence: "Positive", Physical_Activity: 3, Learning_Disabilities: "No", Parental_Education_Level: "College", Distance_from_Home: "Near", Gender: "Female" },
    { Hours_Studied: 14, Attendance: 72, Parental_Involvement: "Low", Access_to_Resources: "Medium", Extracurricular_Activities: "No", Sleep_Hours: 6, Previous_Scores: 64, Motivation_Level: "Low", Internet_Access: "Yes", Tutoring_Sessions: 0, Family_Income: "Low", Teacher_Quality: "Medium", School_Type: "Public", Peer_Influence: "Neutral", Physical_Activity: 1, Learning_Disabilities: "No", Parental_Education_Level: "High School", Distance_from_Home: "Far", Gender: "Male" },
    { Hours_Studied: 30, Attendance: 94, Parental_Involvement: "High", Access_to_Resources: "High", Extracurricular_Activities: "Yes", Sleep_Hours: 8, Previous_Scores: 88, Motivation_Level: "High", Internet_Access: "Yes", Tutoring_Sessions: 3, Family_Income: "High", Teacher_Quality: "High", School_Type: "Private", Peer_Influence: "Positive", Physical_Activity: 4, Learning_Disabilities: "No", Parental_Education_Level: "Postgraduate", Distance_from_Home: "Near", Gender: "Male" },
  ],
};

function initCSVHandler() {
  const dropZone = document.getElementById("drop-zone");
  const csvInput = document.getElementById("csv-input");
  const downloadCsvBtn = document.getElementById("download-csv-btn");
  const clearBtn = document.getElementById("batch-clear-btn");
  const runBatchBtn = document.getElementById("run-batch-btn");

  dropZone.addEventListener("click", () => csvInput.click());
  dropZone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      csvInput.click();
    }
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      handleFileLoad(file);
    } else {
      showBatchError("Please upload a valid CSV file.");
    }
  });

  csvInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) handleFileLoad(file);
  });

  downloadCsvBtn.addEventListener("click", downloadPredictions);
  clearBtn.addEventListener("click", clearBatchState);
  runBatchBtn.addEventListener("click", runBatchPrediction);

  document.querySelectorAll(".btn-batch-scenario").forEach(btn => {
    btn.addEventListener("click", () => handleScenarioClick(btn));
  });
}

function handleScenarioClick(btn) {
  const key = btn.dataset.scenario;

  document.querySelectorAll(".btn-batch-scenario").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  if (key === "download_template") {
    downloadTemplate();
    return;
  }

  const rows = BATCH_SCENARIOS[key];
  if (!rows) return;

  const csvText = rowsToCSV(rows);
  const blob = new Blob([csvText], { type: "text/csv" });
  const file = new File([blob], `${key}.csv`, { type: "text/csv" });
  handleFileLoad(file, `${key}.csv`);
}

function rowsToCSV(rows) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map(h => {
      let val = row[h] !== undefined ? row[h] : "";
      if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(","));
  }
  return lines.join("\n");
}

function handleFileLoad(file, displayName) {
  clearBatchState();
  batchState.fileName = displayName || file.name;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target.result;
      const { headers, rows } = parseCSV(text);

      if (rows.length === 0) {
        showBatchError("CSV file is empty or has no data rows.");
        return;
      }

      batchState.originalHeaders = headers;
      batchState.rawRows = rows;
      batchState.phase = "loaded";

      renderFileInfo(batchState.fileName, rows.length);
      renderValidation(headers, rows);
      showUploadPhase("validated");
    } catch (err) {
      showBatchError("Error parsing CSV: " + err.message);
    }
  };
  reader.readAsText(file);
}

function parseCSV(text) {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx];
      });
      rows.push(row);
    }
  }
  return { headers, rows };
}

function validateCSVData(headers, rows) {
  const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  const extraCols = headers.filter(col => !REQUIRED_COLUMNS.includes(col) && col !== "Exam_Score");
  const hasExamScore = headers.includes("Exam_Score");

  let validRows = 0;
  let invalidRows = 0;
  const invalidReasons = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let rowValid = true;
    for (const col of REQUIRED_COLUMNS) {
      const val = row[col];
      if (val === undefined || val === null || val === "") {
        rowValid = false;
        break;
      }
    }
    if (rowValid) {
      validRows++;
    } else {
      invalidRows++;
      invalidReasons.push(`Row ${i + 1}: missing required field values`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    extraCols,
    hasExamScore,
    totalRows: rows.length,
    validRows,
    invalidRows,
    invalidReasons,
  };
}

function renderFileInfo(name, rowCount) {
  const el = document.getElementById("upload-file-info");
  el.hidden = false;
  el.innerHTML = `<span class="file-icon">&#128196;</span> <strong>${name}</strong> &bull; ${rowCount} row${rowCount !== 1 ? 's' : ''} &bull; <span style="color:var(--success);font-weight:600;">Ready</span>`;
}

function renderValidation(headers, rows) {
  const result = validateCSVData(headers, rows);
  const card = document.getElementById("batch-validation-card");
  const grid = document.getElementById("validation-grid");
  const details = document.getElementById("validation-details");
  const msgEl = document.getElementById("validation-message");

  card.hidden = false;

  const statusClass = result.valid ? "success" : "error";
  const statusText = result.valid ? "All required columns present" : `Missing: ${result.missing.join(", ")}`;

  grid.innerHTML = `
    <div class="validation-kpi">
      <span class="validation-kpi-label">Total Rows</span>
      <span class="validation-kpi-value">${result.totalRows}</span>
    </div>
    <div class="validation-kpi">
      <span class="validation-kpi-label">Valid Rows</span>
      <span class="validation-kpi-value validation-kpi-success">${result.validRows}</span>
    </div>
    <div class="validation-kpi">
      <span class="validation-kpi-label">Invalid Rows</span>
      <span class="validation-kpi-value ${result.invalidRows > 0 ? 'validation-kpi-error' : ''}">${result.invalidRows}</span>
    </div>
    <div class="validation-kpi">
      <span class="validation-kpi-label">Status</span>
      <span class="validation-kpi-value validation-kpi-${statusClass}">${result.valid ? '&#10003; Valid' : '&#10007; Invalid'}</span>
    </div>
  `;

  if (result.valid) {
    msgEl.className = "validation-message validation-message-success";
    msgEl.innerHTML = `&#10003; All <strong>${result.totalRows}</strong> row${result.totalRows !== 1 ? 's' : ''} passed validation and are ready for prediction.`;
    msgEl.hidden = false;
  } else if (result.invalidRows > 0) {
    msgEl.className = "validation-message validation-message-warning";
    msgEl.innerHTML = `&#9888; <strong>${result.invalidRows}</strong> row${result.invalidRows !== 1 ? 's' : ''} need${result.invalidRows === 1 ? 's' : ''} attention. View validation issues below.`;
    msgEl.hidden = false;
  } else {
    msgEl.hidden = true;
  }

  let detailHTML = "";
  if (result.missing.length > 0) {
    detailHTML += `<div class="validation-detail-item validation-detail-error">Missing columns: ${result.missing.join(", ")}</div>`;
  }
  if (result.hasExamScore) {
    detailHTML += `<div class="validation-detail-item validation-detail-info">Exam_Score column found — will be ignored</div>`;
  }
  if (result.extraCols.length > 0) {
    detailHTML += `<div class="validation-detail-item validation-detail-info">Extra columns preserved: ${result.extraCols.join(", ")}</div>`;
  }
  if (result.invalidRows > 0 && result.invalidReasons.length <= 5) {
    for (const reason of result.invalidReasons) {
      detailHTML += `<div class="validation-detail-item validation-detail-warning">${reason}</div>`;
    }
  } else if (result.invalidRows > 5) {
    for (let i = 0; i < 3; i++) {
      detailHTML += `<div class="validation-detail-item validation-detail-warning">${result.invalidReasons[i]}</div>`;
    }
    detailHTML += `<div class="validation-detail-item validation-detail-warning">... and ${result.invalidRows - 3} more invalid rows</div>`;
  }

  details.innerHTML = detailHTML;
  details.hidden = detailHTML === "";

  batchState.phase = result.valid ? "validated" : "error";
  const actionsCard = document.getElementById("batch-actions-card");
  const statusEl = document.getElementById("batch-action-status");
  const runBtn = document.getElementById("run-batch-btn");

  if (result.valid) {
    actionsCard.hidden = false;
    runBtn.disabled = false;
    runBtn.innerHTML = "Run Batch Prediction";
    statusEl.innerHTML = `<span class="action-ready">Ready to predict</span><span class="action-count">${result.validRows} of ${result.totalRows} row${result.totalRows !== 1 ? 's' : ''} are valid</span>`;
    updateWorkflow(2);
  } else {
    actionsCard.hidden = true;
    updateWorkflow(1);
  }
}

function showBatchError(message) {
  const card = document.getElementById("batch-validation-card");
  const grid = document.getElementById("validation-grid");
  const details = document.getElementById("validation-details");
  const msgEl = document.getElementById("validation-message");

  card.hidden = false;
  msgEl.hidden = true;
  grid.innerHTML = `
    <div class="validation-kpi">
      <span class="validation-kpi-label">Status</span>
      <span class="validation-kpi-value validation-kpi-error">&#10007; Error</span>
    </div>
  `;
  details.innerHTML = `<div class="validation-detail-item validation-detail-error">${message}</div>`;
  details.hidden = false;

  batchState.phase = "error";
  document.getElementById("batch-actions-card").hidden = true;
  document.getElementById("batch-results").hidden = true;
  updateWorkflow(1);
}

function showUploadPhase(phase) {
  const clearBtn = document.getElementById("batch-clear-btn");
  clearBtn.hidden = phase !== "validated";

  if (phase === "idle") {
    document.getElementById("batch-validation-card").hidden = true;
    document.getElementById("batch-actions-card").hidden = true;
    document.getElementById("batch-results").hidden = true;
    document.getElementById("upload-file-info").hidden = true;
    document.getElementById("validation-message").hidden = true;
    document.getElementById("batch-table").querySelector("thead").innerHTML = "";
    document.getElementById("batch-table").querySelector("tbody").innerHTML = "";
    updateWorkflow(0);
  }
}

function runBatchPrediction() {
  if (batchState.phase !== "validated") return;

  const runBtn = document.getElementById("run-batch-btn");
  const statusEl = document.getElementById("batch-action-status");
  runBtn.disabled = true;
  runBtn.innerHTML = "Predicting... <span class='btn-spinner'></span>";
  statusEl.innerHTML = `<span style="color:var(--blue);font-weight:500;">Processing records...</span>`;
  document.getElementById("batch-results").hidden = true;
  updateWorkflow(3);

  setTimeout(() => {
    try {
      const predictions = [];
      let validCount = 0;
      let invalidCount = 0;

      for (const row of batchState.rawRows) {
        try {
          const input = {};
          for (const col of REQUIRED_COLUMNS) {
            input[col] = row[col] || null;
          }
          const result = predict(input);
          predictions.push({
            ...row,
            Predicted_Exam_Score: result.score,
            Performance_Category: result.category,
          });
          validCount++;
        } catch {
          invalidCount++;
          predictions.push({
            ...row,
            Predicted_Exam_Score: null,
            Performance_Category: "Error",
          });
        }
      }

      batchState.predictions = predictions;
      batchState.phase = "predicted";
      batchState.currentPage = 1;
      batchState.totalPages = Math.ceil(predictions.length / BATCH_PAGE_SIZE);

      renderBatchSummary(predictions);
      renderBatchDistribution(predictions);
      renderBatchTable();
      renderPagination();

      document.getElementById("batch-results").hidden = false;
      runBtn.innerHTML = "Run Batch Prediction Again";
      runBtn.disabled = false;
      statusEl.innerHTML = `<span class="action-complete">&#10003; ${validCount} prediction${validCount !== 1 ? 's' : ''} completed successfully</span>`;
      updateWorkflow(4);
    } catch (err) {
      showBatchError("Prediction error: " + err.message);
      runBtn.innerHTML = "Run Batch Prediction";
      runBtn.disabled = false;
    }
  }, 150);
}

function renderBatchSummary(predictions) {
  const kpiGrid = document.getElementById("batch-kpi-grid");

  const total = predictions.length;
  const validPredictions = predictions.filter(p => p.Predicted_Exam_Score !== null);
  const avgScore = validPredictions.length > 0
    ? (validPredictions.reduce((s, p) => s + p.Predicted_Exam_Score, 0) / validPredictions.length)
    : 0;

  const categories = { "At Risk": 0, "Average": 0, "Good": 0, "Excellent": 0 };
  for (const p of validPredictions) {
    if (categories[p.Performance_Category] !== undefined) {
      categories[p.Performance_Category]++;
    }
  }

  kpiGrid.innerHTML = `
    <div class="batch-kpi batch-kpi-primary">
      <span class="batch-kpi-label">Avg Predicted Score</span>
      <span class="batch-kpi-value">${avgScore.toFixed(1)}</span>
    </div>
    <div class="batch-kpi">
      <span class="batch-kpi-label">At Risk</span>
      <span class="batch-kpi-value batch-kpi-red">${categories["At Risk"]}</span>
    </div>
    <div class="batch-kpi">
      <span class="batch-kpi-label">Average</span>
      <span class="batch-kpi-value batch-kpi-amber">${categories["Average"]}</span>
    </div>
    <div class="batch-kpi">
      <span class="batch-kpi-label">Good</span>
      <span class="batch-kpi-value batch-kpi-blue-dark">${categories["Good"]}</span>
    </div>
    <div class="batch-kpi">
      <span class="batch-kpi-label">Excellent</span>
      <span class="batch-kpi-value batch-kpi-teal">${categories["Excellent"]}</span>
    </div>
  `;
}

function renderBatchDistribution(predictions) {
  const container = document.getElementById("batch-distribution");
  const validPredictions = predictions.filter(p => p.Predicted_Exam_Score !== null);
  const total = validPredictions.length;
  if (total === 0) { container.hidden = true; return; }

  const categories = { "At Risk": 0, "Average": 0, "Good": 0, "Excellent": 0 };
  for (const p of validPredictions) {
    if (categories[p.Performance_Category] !== undefined) {
      categories[p.Performance_Category]++;
    }
  }

  const maxCount = Math.max(...Object.values(categories), 1);
  const bars = [
    { label: "At Risk", count: categories["At Risk"], fillClass: "batch-dist-fill-red" },
    { label: "Average", count: categories["Average"], fillClass: "batch-dist-fill-amber" },
    { label: "Good", count: categories["Good"], fillClass: "batch-dist-fill-indigo" },
    { label: "Excellent", count: categories["Excellent"], fillClass: "batch-dist-fill-teal" },
  ];

  container.hidden = false;
  container.innerHTML = `
    <div class="batch-distribution-title">Prediction Distribution</div>
    <div class="batch-dist-bars">
      ${bars.map(b => `
        <div class="batch-dist-row">
          <span class="batch-dist-label">${b.label}</span>
          <div class="batch-dist-track">
            <div class="batch-dist-fill ${b.fillClass}" style="width: ${Math.max((b.count / maxCount) * 100, 0)}%"></div>
          </div>
          <span class="batch-dist-count">${b.count}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function renderBatchTable() {
  const table = document.getElementById("batch-table");
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");
  const start = (batchState.currentPage - 1) * BATCH_PAGE_SIZE;
  const end = Math.min(start + BATCH_PAGE_SIZE, batchState.predictions.length);
  const pageData = batchState.predictions.slice(start, end);

  thead.innerHTML = `<tr>
    <th>#</th>
    <th>Input Row</th>
    <th>Predicted Score</th>
    <th>Performance Category</th>
    <th>Status</th>
  </tr>`;

  tbody.innerHTML = "";
  for (let i = 0; i < pageData.length; i++) {
    const row = pageData[i];
    const globalIdx = start + i + 1;
    const tr = document.createElement("tr");

    const hasScore = row.Predicted_Exam_Score !== null;
    const scoreDisplay = hasScore ? `<strong>${row.Predicted_Exam_Score.toFixed(1)}</strong>` : "--";
    const catClass = hasScore ? `category-${row.Performance_Category.toLowerCase().replace(/\s+/g, "-")}` : "category-error";
    const catDisplay = hasScore
      ? `<span class="category-badge ${catClass}" style="font-size:0.6875rem;padding:0.1875rem 0.5rem;">${row.Performance_Category}</span>`
      : `<span class="category-badge category-error" style="font-size:0.6875rem;padding:0.1875rem 0.5rem;">Error</span>`;
    const statusDisplay = hasScore
      ? '<span class="batch-status-ok">&#10003; OK</span>'
      : '<span class="batch-status-fail">&#10007; Failed</span>';

    tr.innerHTML = `<td class="batch-row-num">${globalIdx}</td><td class="batch-input-row">Row ${globalIdx}</td><td>${scoreDisplay}</td><td>${catDisplay}</td><td>${statusDisplay}</td>`;
    tbody.appendChild(tr);
  }

  document.getElementById("batch-table-info").textContent = `Showing ${start + 1}\u2013${end} of ${batchState.predictions.length}`;
}

function renderPagination() {
  const container = document.getElementById("batch-pagination");
  container.innerHTML = "";

  if (batchState.totalPages <= 1) return;

  const prevBtn = document.createElement("button");
  prevBtn.className = "btn btn-secondary btn-sm";
  prevBtn.textContent = "\u2190 Prev";
  prevBtn.disabled = batchState.currentPage <= 1;
  prevBtn.addEventListener("click", () => {
    if (batchState.currentPage > 1) {
      batchState.currentPage--;
      renderBatchTable();
      renderPagination();
    }
  });
  container.appendChild(prevBtn);

  for (let p = 1; p <= batchState.totalPages; p++) {
    const pageBtn = document.createElement("button");
    pageBtn.className = `btn btn-sm btn-page ${p === batchState.currentPage ? 'btn-page-active' : ''}`;
    pageBtn.textContent = p;
    pageBtn.addEventListener("click", () => {
      batchState.currentPage = p;
      renderBatchTable();
      renderPagination();
    });
    container.appendChild(pageBtn);
  }

  const nextBtn = document.createElement("button");
  nextBtn.className = "btn btn-secondary btn-sm";
  nextBtn.textContent = "Next \u2192";
  nextBtn.disabled = batchState.currentPage >= batchState.totalPages;
  nextBtn.addEventListener("click", () => {
    if (batchState.currentPage < batchState.totalPages) {
      batchState.currentPage++;
      renderBatchTable();
      renderPagination();
    }
  });
  container.appendChild(nextBtn);
}

function downloadPredictions() {
  if (!batchState.predictions || batchState.predictions.length === 0) return;

  const headers = Object.keys(batchState.predictions[0]);
  const csvRows = [headers.join(",")];

  for (const row of batchState.predictions) {
    const values = headers.map(h => {
      let val = row[h] !== undefined && row[h] !== null ? row[h] : "";
      if (typeof val === "string" && (val.includes(",") || val.includes('"'))) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(values.join(","));
  }

  downloadFile(csvRows.join("\n"), "student_predictions.csv", "text/csv");
}

function downloadTemplate() {
  const headers = REQUIRED_COLUMNS.join(",");
  const exampleRows = [
    "20,85,Medium,High,Yes,7,78,Medium,Yes,2,Medium,High,Public,Positive,3,No,College,Near,Male",
    "30,92,High,High,Yes,8,88,High,Yes,4,High,High,Private,Positive,5,No,Postgraduate,Near,Female",
    "10,65,Low,Low,No,5,55,Low,No,0,Low,Low,Public,Negative,1,Yes,High School,Far,Male",
  ];
  const csv = headers + "\n" + exampleRows.join("\n") + "\n";
  downloadFile(csv, "student_predictions_template.csv", "text/csv");
}

function updateWorkflow(activeStep) {
  const steps = document.querySelectorAll(".workflow-step");
  steps.forEach((step, i) => {
    step.classList.remove("active", "completed");
    const numEl = step.querySelector(".workflow-num");
    if (i + 1 < activeStep) {
      step.classList.add("completed");
      if (numEl) numEl.innerHTML = "&#10003;";
    } else if (i + 1 === activeStep) {
      step.classList.add("active");
      if (numEl) numEl.textContent = "0" + (i + 1);
    } else {
      if (numEl) numEl.textContent = "0" + (i + 1);
    }
  });
}

function clearBatchState() {
  batchState = {
    phase: "idle",
    fileName: "",
    originalHeaders: [],
    rawRows: [],
    predictions: [],
    currentPage: 1,
    totalPages: 1,
  };

  document.getElementById("csv-input").value = "";
  document.getElementById("batch-results").hidden = true;
  document.getElementById("batch-distribution").hidden = true;
  document.getElementById("batch-table").querySelector("thead").innerHTML = "";
  document.getElementById("batch-table").querySelector("tbody").innerHTML = "";
  document.getElementById("batch-pagination").innerHTML = "";
  document.getElementById("batch-table-info").textContent = "";
  document.getElementById("batch-kpi-grid").innerHTML = "";

  showUploadPhase("idle");
  updateWorkflow(1);
  document.querySelectorAll(".btn-batch-scenario").forEach(b => b.classList.remove("active"));
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type: type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
