#!/usr/bin/env python3
"""
Generate 2 workouts for today (September 11, 2025) for lars-olof@allerhed.com
This will add workouts to the current date so the dashboard shows data.
"""

import psycopg2
import random
from datetime import datetime, timezone
import uuid

# Database connection
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'rythm',
    'user': 'rythm_api',
    'password': 'rythm_password'
}

USER_ID = 'e8d9e60d-aa7a-4066-984f-53371b902c68'
TENANT_ID = '9386cbbf-24eb-4593-a2e2-b94b9578caba'
TODAY = '2025-09-11'

def get_exercises(conn):
    """Get available exercises from the database"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT exercise_id, name, exercise_type, default_value_1_type, default_value_2_type 
        FROM exercises 
        WHERE is_active = true
        ORDER BY name
    """)
    return cursor.fetchall()

def create_todays_workouts(conn):
    """Create 2 workouts for today"""
    cursor = conn.cursor()
    
    # Get exercises
    exercises = get_exercises(conn)
    strength_exercises = [ex for ex in exercises if ex[2] == 'strength']
    cardio_exercises = [ex for ex in exercises if ex[2] == 'cardio']
    
    print(f"Available exercises: {len(exercises)} total ({len(strength_exercises)} strength, {len(cardio_exercises)} cardio)")
    
    workouts = []
    
    # Workout 1: Morning Strength Session
    workout1_exercises = random.sample(strength_exercises, 3)  # 3 strength exercises
    workout1_time = f"{TODAY} 08:30:00+00"  # 8:30 AM
    
    session1_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO sessions (session_id, tenant_id, user_id, name, category, notes, started_at, training_load, perceived_exertion, duration_seconds)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING session_id
    """, (
        session1_id, TENANT_ID, USER_ID,
        "Morning Strength Training",
        "strength",
        "Great morning session! Feeling strong and ready for the day.",
        workout1_time,
        random.randint(200, 350),  # Training load
        random.randint(6, 9),       # Perceived exertion
        random.randint(45*60, 75*60)  # 45-75 minutes
    ))
    
    print(f"Created workout 1: Morning Strength Training at {workout1_time}")
    
    # Add sets for workout 1
    for i, (ex_id, ex_name, ex_type, val1_type, val2_type) in enumerate(workout1_exercises):
        num_sets = random.randint(3, 5)
        print(f"  Exercise {i+1}: {ex_name} ({num_sets} sets)")
        
        for set_num in range(num_sets):
            # Generate appropriate values based on exercise type
            if val1_type == 'weight' and val2_type == 'reps':
                weight = random.randint(60, 140)  # kg
                reps = random.randint(5, 12)
                cursor.execute("""
                    INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (TENANT_ID, session1_id, ex_id, set_num + 1, 'weight', weight, 'reps', reps))
                print(f"    Set {set_num + 1}: {weight}kg × {reps} reps")
            elif val1_type == 'reps':
                reps = random.randint(8, 25)
                cursor.execute("""
                    INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (TENANT_ID, session1_id, ex_id, set_num + 1, 'reps', reps))
                print(f"    Set {set_num + 1}: {reps} reps")
    
    # Workout 2: Evening Cardio + Hybrid Session
    workout2_exercises = random.sample(cardio_exercises, 2) + random.sample(strength_exercises, 1)  # 2 cardio + 1 strength
    workout2_time = f"{TODAY} 18:45:00+00"  # 6:45 PM
    
    session2_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO sessions (session_id, tenant_id, user_id, name, category, notes, started_at, training_load, perceived_exertion, duration_seconds)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING session_id
    """, (
        session2_id, TENANT_ID, USER_ID,
        "Evening Hybrid Training",
        "hybrid",
        "Perfect end to the day! Combined cardio and strength for a balanced session.",
        workout2_time,
        random.randint(180, 280),  # Training load
        random.randint(7, 9),       # Perceived exertion
        random.randint(35*60, 60*60)  # 35-60 minutes
    ))
    
    print(f"Created workout 2: Evening Hybrid Training at {workout2_time}")
    
    # Add sets for workout 2
    for i, (ex_id, ex_name, ex_type, val1_type, val2_type) in enumerate(workout2_exercises):
        if ex_type == 'cardio':
            num_sets = random.randint(1, 3)  # Fewer sets for cardio
            print(f"  Exercise {i+1}: {ex_name} ({num_sets} intervals)")
            
            for set_num in range(num_sets):
                if val1_type == 'distance' and val2_type == 'time':
                    distance = random.randint(800, 2000)  # meters
                    time_seconds = random.randint(180, 480)  # 3-8 minutes
                    cursor.execute("""
                        INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (TENANT_ID, session2_id, ex_id, set_num + 1, 'distance', distance, 'time', time_seconds))
                    print(f"    Set {set_num + 1}: {distance}m in {time_seconds}s")
                elif val1_type == 'time':
                    time_seconds = random.randint(300, 1200)  # 5-20 minutes
                    cursor.execute("""
                        INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric)
                        VALUES (%s, %s, %s, %s, %s, %s)
                    """, (TENANT_ID, session2_id, ex_id, set_num + 1, 'time', time_seconds))
                    print(f"    Set {set_num + 1}: {time_seconds}s duration")
        else:  # strength exercise
            num_sets = random.randint(3, 4)
            print(f"  Exercise {i+1}: {ex_name} ({num_sets} sets)")
            
            for set_num in range(num_sets):
                if val1_type == 'weight' and val2_type == 'reps':
                    weight = random.randint(70, 120)  # kg
                    reps = random.randint(6, 15)
                    cursor.execute("""
                        INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """, (TENANT_ID, session2_id, ex_id, set_num + 1, 'weight', weight, 'reps', reps))
                    print(f"    Set {set_num + 1}: {weight}kg × {reps} reps")
    
    workouts.extend([session1_id, session2_id])
    return workouts

def main():
    """Main function to generate today's workouts"""
    print(f"🏋️ Generating 2 workouts for {TODAY} for lars-olof@allerhed.com")
    print("="*60)
    
    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        
        # Generate workouts
        workout_ids = create_todays_workouts(conn)
        
        # Commit changes
        conn.commit()
        print("\n✅ Successfully committed workouts to database!")
        
        # Verify the workouts were created
        cursor = conn.cursor()
        cursor.execute("""
            SELECT s.name, s.category, s.started_at, s.training_load, s.perceived_exertion,
                   COUNT(st.set_id) as total_sets,
                   COUNT(DISTINCT st.exercise_id) as exercise_count
            FROM sessions s
            LEFT JOIN sets st ON s.session_id = st.session_id
            WHERE s.user_id = %s AND DATE(s.started_at) = %s
            GROUP BY s.session_id, s.name, s.category, s.started_at, s.training_load, s.perceived_exertion
            ORDER BY s.started_at
        """, (USER_ID, TODAY))
        
        results = cursor.fetchall()
        print(f"\n📊 VERIFICATION: Found {len(results)} workouts for {TODAY}")
        for i, (name, category, started_at, load, rpe, sets, exercises) in enumerate(results):
            print(f"  {i+1}. {name}")
            print(f"     Category: {category.upper()}, Load: {load}, RPE: {rpe}/10")
            print(f"     Time: {started_at}, Sets: {sets}, Exercises: {exercises}")
        
        conn.close()
        
        print(f"\n🎉 SUCCESS! Generated 2 workouts for today ({TODAY})")
        print("The dashboard should now show today's workouts!")
        
    except Exception as error:
        print(f"❌ ERROR: {error}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()

if __name__ == "__main__":
    main()