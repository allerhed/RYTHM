#!/usr/bin/env python3
"""
Workout Generation Script for Lars-Olof Allerhed
Generates 100 workouts over 6 months as specified in LARS_WORKOUT_GENERATION_SUMMARY.md
"""

import random
import json
import psycopg2
from datetime import datetime, timedelta
from uuid import uuid4

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'rythm',
    'user': 'rythm_api',
    'password': 'password'
}

# User configuration
USER_ID = 'e8d9e60d-aa7a-4066-984f-53371b902c68'
TENANT_ID = '9386cbbf-24eb-4593-a2e2-b94b9578caba'
USER_EMAIL = 'lars-olof@allerhed.com'

# Workout parameters
TOTAL_WORKOUTS = 100
START_DATE = datetime(2025, 3, 1)  # March 2025
END_DATE = datetime(2025, 9, 11)   # Today (September 11, 2025)

# Exercise parameters
EXERCISES_PER_WORKOUT = (1, 3)  # 1-3 exercises per workout
SETS_PER_EXERCISE = (2, 5)      # 2-5 sets per exercise
TRAINING_LOAD_RANGE = (50, 450) # Training load range
DURATION_RANGE = (20, 90)       # Duration range in minutes

# Motivational workout notes
WORKOUT_NOTES = [
    "Crush your goals today! 💪",
    "Every rep counts - make it happen! 🔥", 
    "Push through the burn - you've got this! 🚀",
    "Consistency is key - keep showing up! 💯",
    "Transform your body, transform your life! ✨",
    "Beast mode: ACTIVATED! 🦁",
    "Stronger than yesterday! 💪",
    "No excuses, just results! 🎯",
    "Pain is temporary, pride is forever! 🏆",
    "Embrace the grind! 🔨",
    "Champions are made in the gym! 👑",
    "Your only limit is you! 🚀",
    "Sweat is just fat crying! 😅",
    "Train like a beast, look like a beauty! 🔥",
    "Success starts with self-discipline! 🎯",
    "Every workout is progress! 📈",
    "Mind over matter! 🧠",
    "Earn your body! 💪",
    "Dedication pays dividends! 💰",
    "Excellence is a habit! ⭐"
]

def generate_random_date(start_date, end_date):
    """Generate a random date between start_date and end_date"""
    time_between = end_date - start_date
    days_between = time_between.days
    random_days = random.randint(0, days_between)
    
    # Add random time of day (morning workouts more likely)
    hour = random.choices([6, 7, 8, 9, 10, 17, 18, 19], weights=[15, 20, 15, 10, 5, 10, 15, 10])[0]
    minute = random.randint(0, 59)
    
    return start_date + timedelta(days=random_days, hours=hour, minutes=minute)

def get_exercises_from_db(conn):
    """Fetch all exercises from database categorized by type"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT exercise_id, name, exercise_category, exercise_type, 
               muscle_groups, default_value_1_type, default_value_2_type
        FROM exercises 
        ORDER BY exercise_category, name
    """)
    
    exercises = cursor.fetchall()
    
    strength_exercises = []
    cardio_exercises = []
    
    for ex in exercises:
        exercise_data = {
            'exercise_id': ex[0],
            'name': ex[1],
            'exercise_category': ex[2],
            'exercise_type': ex[3],
            'muscle_groups': ex[4],
            'default_value_1_type': ex[5],
            'default_value_2_type': ex[6]
        }
        
        if ex[3] == 'STRENGTH':
            strength_exercises.append(exercise_data)
        elif ex[3] == 'CARDIO':
            cardio_exercises.append(exercise_data)
    
    return strength_exercises, cardio_exercises

def generate_weight_for_exercise(exercise_name, exercise_type):
    """Generate realistic weights based on exercise type and name"""
    if exercise_type != 'STRENGTH':
        return None
    
    # Weight ranges for different exercise types (in kg)
    weight_ranges = {
        # Compound movements - heavier
        'Deadlift': (80, 180),
        'Back Squat': (70, 150),
        'Front Squat': (60, 120),
        'Bench Press': (60, 120),
        
        # Olympic lifts - moderate to heavy
        'Power Clean': (50, 100),
        'Squat Clean': (50, 100),
        'Power Snatch': (40, 80),
        'Squat Snatch': (40, 80),
        'Thruster': (40, 80),
        'Push Jerk': (50, 90),
        'Split Jerk': (50, 90),
        
        # Overhead pressing - moderate
        'Standing Overhead Press': (40, 80),
        'Strict Press': (40, 80),
        'Push Press': (45, 85),
        'Seated Z-press': (30, 60),
        
        # Unilateral/Accessory - lighter
        'Bulgarian Split Squat': (20, 60),
        'Dumbbell Biceps Curl': (10, 30),
        'Incline Dumbbell Press': (20, 50),
        'Landmine Press': (20, 40),
        'Landmine Chest Press': (25, 45),
        
        # Cable/Machine work
        'Lat Pull Down Wide': (40, 90),
        'Lat Pull Down Narrow': (40, 90),
        'Seated Row': (40, 80),
        'Cable Triceps Push': (20, 50),
        'Seated Trap Pull': (30, 60),
        'Cross Body Rear Delt Cable': (15, 35),
        'Pallof Press': (10, 30),
        
        # Sled work
        'Sled Push': (40, 120),
        'Sled Pull': (40, 120),
        
        # Carries
        'Farmers Carry': (30, 80),
        
        # Med ball
        'Wall-balls': (8, 25),
        'Wall Ball Shot': (8, 25),
        'Med-ball Chest Pass': (6, 20)
    }
    
    # Default range for unlisted exercises
    default_range = (20, 60)
    
    for key, weight_range in weight_ranges.items():
        if key.lower() in exercise_name.lower():
            return random.randint(weight_range[0], weight_range[1])
    
    return random.randint(default_range[0], default_range[1])

def generate_reps_for_exercise(exercise_name, exercise_type):
    """Generate realistic rep ranges based on exercise type"""
    if exercise_type != 'STRENGTH':
        return None
    
    # Rep ranges for different exercise types
    rep_ranges = {
        # Heavy compound movements - lower reps
        'Deadlift': (1, 6),
        'Back Squat': (2, 8),
        'Front Squat': (3, 8),
        'Bench Press': (3, 8),
        
        # Olympic lifts - very low reps
        'Clean': (1, 5),
        'Snatch': (1, 5),
        'Jerk': (1, 5),
        'Thruster': (3, 8),
        
        # Pressing movements
        'Press': (3, 8),
        'Push Press': (3, 8),
        
        # Bodyweight movements - higher reps
        'Push-ups': (8, 25),
        'Pull-Up': (3, 15),
        'Muscle-Up': (1, 8),
        'Handstand Push-Up': (2, 12),
        'Dip': (5, 20),
        'Burpee': (5, 20),
        'Box Jump': (5, 15),
        'Sit-Up': (10, 30),
        'Toes-to-Bar': (5, 20),
        
        # Accessory work - moderate to high reps
        'Curl': (8, 15),
        'Extension': (8, 15),
        'Row': (8, 15),
        'Pull Down': (8, 15),
        'Fly': (8, 15),
        
        # Carries and functional - distance or time based
        'Carry': (1, 1),  # Will use distance
        'Walk': (1, 1),   # Will use distance
        'Climb': (1, 5)   # Rope climbs
    }
    
    # Find matching rep range
    for key, rep_range in rep_ranges.items():
        if key.lower() in exercise_name.lower():
            return random.randint(rep_range[0], rep_range[1])
    
    # Default rep range
    return random.randint(5, 12)

def generate_cardio_values(exercise):
    """Generate appropriate cardio values based on exercise type"""
    name = exercise['name']
    value1_type = exercise['default_value_1_type']
    value2_type = exercise['default_value_2_type']
    
    values = {}
    
    # Distance-based cardio
    if value1_type == 'distance_m':
        if 'Run' in name:
            values['value_1_numeric'] = random.randint(400, 5000)  # 400m - 5km
        elif 'Row' in name:
            values['value_1_numeric'] = random.randint(250, 2000)  # 250m - 2km
        else:
            values['value_1_numeric'] = random.randint(500, 2000)
        
        values['value_1_type'] = 'distance_m'
    
    # Calorie-based cardio
    elif value1_type == 'calories':
        if 'Echo Bike' in name or 'Ski-erg' in name:
            values['value_1_numeric'] = random.randint(10, 50)  # 10-50 calories
        else:
            values['value_1_numeric'] = random.randint(15, 40)
        
        values['value_1_type'] = 'calories'
    
    # Reps-based (jump rope)
    elif value1_type == 'reps':
        if 'Double-Under' in name:
            values['value_1_numeric'] = random.randint(50, 300)  # 50-300 double unders
        elif 'Single-Under' in name:
            values['value_1_numeric'] = random.randint(100, 500)  # 100-500 single unders
        else:
            values['value_1_numeric'] = random.randint(20, 100)
        
        values['value_1_type'] = 'reps'
    
    # Duration (always second value for cardio)
    if value2_type == 'duration_s':
        # Generate realistic time based on exercise
        if 'Run' in name:
            values['value_2_numeric'] = random.randint(120, 1800)  # 2-30 minutes
        elif 'Row' in name:
            values['value_2_numeric'] = random.randint(60, 900)    # 1-15 minutes
        elif 'Echo Bike' in name or 'Ski-erg' in name:
            values['value_2_numeric'] = random.randint(30, 600)    # 30s-10min
        elif 'Under' in name:  # Jump rope
            values['value_2_numeric'] = random.randint(60, 300)    # 1-5 minutes
        else:
            values['value_2_numeric'] = random.randint(60, 600)
        
        values['value_2_type'] = 'duration_s'
    
    return values

def create_workout_session(conn, workout_num, workout_date, category, exercises):
    """Create a workout session in the database"""
    cursor = conn.cursor()
    
    # Generate session data
    session_id = str(uuid4())
    training_load = random.randint(TRAINING_LOAD_RANGE[0], TRAINING_LOAD_RANGE[1])
    duration_minutes = random.randint(DURATION_RANGE[0], DURATION_RANGE[1])
    perceived_exertion = random.randint(1, 10)
    workout_note = random.choice(WORKOUT_NOTES)
    
    # Create session
    cursor.execute("""
        INSERT INTO sessions (
            session_id, user_id, tenant_id, category, notes, 
            started_at, completed_at, training_load, perceived_exertion
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        session_id,
        USER_ID,
        TENANT_ID,
        category,
        workout_note,
        workout_date,
        workout_date + timedelta(minutes=duration_minutes),
        training_load,
        perceived_exertion
    ))
    
    # Add exercises and sets
    for exercise in exercises:
        num_sets = random.randint(SETS_PER_EXERCISE[0], SETS_PER_EXERCISE[1])
        
        for set_num in range(num_sets):
            set_id = str(uuid4())
            
            if exercise['exercise_type'] == 'STRENGTH':
                # Strength exercise
                weight = generate_weight_for_exercise(exercise['name'], exercise['exercise_type'])
                reps = generate_reps_for_exercise(exercise['name'], exercise['exercise_type'])
                
                cursor.execute("""
                    INSERT INTO sets (
                        set_id, session_id, exercise_id, tenant_id, set_index,
                        value_1_type, value_1_numeric, value_2_type, value_2_numeric
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    set_id, session_id, exercise['exercise_id'], TENANT_ID, set_num + 1,  # set_index starts from 1
                    'weight_kg', weight, 'reps', reps
                ))
            
            elif exercise['exercise_type'] == 'CARDIO':
                # Cardio exercise
                cardio_values = generate_cardio_values(exercise)
                
                cursor.execute("""
                    INSERT INTO sets (
                        set_id, session_id, exercise_id, tenant_id, set_index,
                        value_1_type, value_1_numeric, value_2_type, value_2_numeric
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    set_id, session_id, exercise['exercise_id'], TENANT_ID, set_num + 1,  # set_index starts from 1
                    cardio_values.get('value_1_type'), cardio_values.get('value_1_numeric'),
                    cardio_values.get('value_2_type'), cardio_values.get('value_2_numeric')
                ))
    
    return {
        'session_id': session_id,
        'category': category,
        'date': workout_date,
        'training_load': training_load,
        'duration': duration_minutes,
        'exercises': [ex['name'] for ex in exercises]
    }

def main():
    """Main workout generation function"""
    print("🎯 Starting workout generation for Lars-Olof Allerhed...")
    print(f"📅 Period: {START_DATE.strftime('%B %Y')} - {END_DATE.strftime('%B %Y')}")
    print(f"🏋️ Target: {TOTAL_WORKOUTS} workouts")
    
    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        print("✅ Database connected successfully")
        
        # Get exercises
        strength_exercises, cardio_exercises = get_exercises_from_db(conn)
        print(f"💪 Loaded {len(strength_exercises)} strength exercises")
        print(f"🏃 Loaded {len(cardio_exercises)} cardio exercises")
        
        # Workout categories and their distribution
        workout_categories = ['strength', 'cardio', 'hybrid']
        category_weights = [0.31, 0.36, 0.33]  # From the specification
        
        generated_workouts = []
        
        for i in range(TOTAL_WORKOUTS):
            # Select workout category
            category = random.choices(workout_categories, weights=category_weights)[0]
            
            # Generate workout date
            workout_date = generate_random_date(START_DATE, END_DATE)
            
            # Select exercises based on category
            if category == 'strength':
                # Pure strength workout
                workout_exercises = random.sample(strength_exercises, 
                                               random.randint(EXERCISES_PER_WORKOUT[0], EXERCISES_PER_WORKOUT[1]))
            elif category == 'cardio':
                # Pure cardio workout
                workout_exercises = random.sample(cardio_exercises, 
                                               random.randint(EXERCISES_PER_WORKOUT[0], min(EXERCISES_PER_WORKOUT[1], len(cardio_exercises))))
            else:  # hybrid
                # Mix of strength and cardio
                num_exercises = random.randint(EXERCISES_PER_WORKOUT[0], EXERCISES_PER_WORKOUT[1])
                strength_count = random.randint(1, max(1, num_exercises-1))
                cardio_count = num_exercises - strength_count
                
                workout_exercises = []
                if strength_count > 0:
                    workout_exercises.extend(random.sample(strength_exercises, min(strength_count, len(strength_exercises))))
                if cardio_count > 0:
                    workout_exercises.extend(random.sample(cardio_exercises, min(cardio_count, len(cardio_exercises))))
            
            # Create the workout
            workout = create_workout_session(conn, i+1, workout_date, category, workout_exercises)
            generated_workouts.append(workout)
            
            if (i + 1) % 10 == 0:
                print(f"⚡ Generated {i+1}/{TOTAL_WORKOUTS} workouts...")
        
        # Commit all changes
        conn.commit()
        print("✅ All workouts committed to database!")
        
        # Generate summary statistics
        print("\n📊 GENERATION SUMMARY:")
        print("="*50)
        
        strength_count = len([w for w in generated_workouts if w['category'] == 'strength'])
        cardio_count = len([w for w in generated_workouts if w['category'] == 'cardio'])
        hybrid_count = len([w for w in generated_workouts if w['category'] == 'hybrid'])
        
        print(f"💪 Strength workouts: {strength_count} ({strength_count/TOTAL_WORKOUTS*100:.1f}%)")
        print(f"🏃 Cardio workouts: {cardio_count} ({cardio_count/TOTAL_WORKOUTS*100:.1f}%)")
        print(f"🔥 Hybrid workouts: {hybrid_count} ({hybrid_count/TOTAL_WORKOUTS*100:.1f}%)")
        
        avg_load = sum(w['training_load'] for w in generated_workouts) / len(generated_workouts)
        avg_duration = sum(w['duration'] for w in generated_workouts) / len(generated_workouts)
        
        print(f"📈 Average training load: {avg_load:.0f}")
        print(f"⏱️ Average duration: {avg_duration:.0f} minutes")
        
        # Show date distribution by month
        monthly_counts = {}
        for workout in generated_workouts:
            month_key = workout['date'].strftime('%Y-%m')
            monthly_counts[month_key] = monthly_counts.get(month_key, 0) + 1
        
        print(f"\n📅 Monthly distribution:")
        for month, count in sorted(monthly_counts.items()):
            month_name = datetime.strptime(month, '%Y-%m').strftime('%B %Y')
            print(f"   {month_name}: {count} workouts")
        
        print(f"\n🎉 SUCCESS! Generated {TOTAL_WORKOUTS} workouts for {USER_EMAIL}")
        print("💪 Ready to crush those fitness goals!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()