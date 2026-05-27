//! Random diagnosis generator that simulates ML inference results.
//!
//! This module produces a ranked list of [`DiagnosisEntry`] values by
//! shuffling the syndrome catalogue, selecting the top 10, and assigning
//! geometrically-decaying confidence scores.  The results are sorted in
//! descending confidence order and assigned sequential ranks starting at 1.
//!
//! # Example
//!
//! ```rust,ignore
//! use oblivion_recognition::generator::generate_random_diagnoses;
//! use oblivion_recognition::syndromes::get_syndromes;
//!
//! let syndromes = get_syndromes();
//! let diagnoses = generate_random_diagnoses(&syndromes);
//!
//! assert_eq!(diagnoses.len(), 10);
//! assert_eq!(diagnoses[0].rank, 1);
//! assert!(diagnoses[0].confidence > diagnoses[1].confidence);
//! ```

use oblivion_common::DiagnosisEntry;
use rand::Rng;
use rand::seq::SliceRandom;

use crate::syndromes::SyndromeInfo;

/// Number of top diagnoses returned per analysis request.
const TOP_N: usize = 10;

/// Generate a randomised ranked differential diagnosis list.
///
/// The algorithm:
/// 1. Shuffles a clone of `syndromes` in-place using a cryptographically
///    seeded OS-backed RNG.
/// 2. Selects the first `10` entries from the shuffled slice.
/// 3. Assigns confidence scores: rank-1 receives a value in `[0.30, 0.95)`,
///    and each subsequent rank multiplies the previous score by a factor
///    sampled uniformly from `[0.50, 0.90)`, ensuring strict monotonic decay.
/// 4. Returns the entries sorted by confidence descending with 1-based ranks.
///
/// # Panics
///
/// Panics if `syndromes` contains fewer than 10 entries.
#[must_use]
pub fn generate_random_diagnoses(syndromes: &[SyndromeInfo]) -> Vec<DiagnosisEntry> {
    assert!(
        syndromes.len() >= TOP_N,
        "syndrome catalogue must contain at least {TOP_N} entries"
    );

    let mut rng = rand::rng();

    // Clone into a mutable vec so we can shuffle without mutating the caller's
    // slice, which is shared across concurrent Kafka messages.
    let mut pool: Vec<&SyndromeInfo> = syndromes.iter().collect();
    pool.shuffle(&mut rng);

    // Top confidence: uniform in [0.30, 0.95).
    let mut confidence: f64 = rng.random_range(0.30_f64..0.95_f64);

    pool.iter()
        .take(TOP_N)
        .enumerate()
        .map(|(index, syndrome)| {
            // Decay factor applied for every rank after the first.
            if index > 0 {
                let factor: f64 = rng.random_range(0.50_f64..0.90_f64);
                confidence *= factor;
            }

            DiagnosisEntry {
                syndrome_id: syndrome.id,
                syndrome_name: syndrome.name.to_string(),
                confidence,
                rank: i32::try_from(index + 1).expect("rank fits in i32"),
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::syndromes::get_syndromes;

    #[test]
    fn returns_exactly_ten_diagnoses() {
        let syndromes = get_syndromes();
        let diagnoses = generate_random_diagnoses(&syndromes);
        assert_eq!(diagnoses.len(), 10);
    }

    #[test]
    fn ranks_are_sequential_one_based() {
        let syndromes = get_syndromes();
        let diagnoses = generate_random_diagnoses(&syndromes);
        for (i, entry) in diagnoses.iter().enumerate() {
            assert_eq!(entry.rank, i32::try_from(i + 1).unwrap());
        }
    }

    #[test]
    fn confidence_is_strictly_decreasing() {
        let syndromes = get_syndromes();
        let diagnoses = generate_random_diagnoses(&syndromes);
        for window in diagnoses.windows(2) {
            assert!(
                window[0].confidence > window[1].confidence,
                "confidence not strictly decreasing: {} <= {}",
                window[0].confidence,
                window[1].confidence
            );
        }
    }

    #[test]
    fn top_confidence_is_within_bounds() {
        let syndromes = get_syndromes();
        // Run several times to catch outliers probabilistically.
        for _ in 0..100 {
            let diagnoses = generate_random_diagnoses(&syndromes);
            let top = diagnoses[0].confidence;
            assert!(
                (0.30..0.95).contains(&top),
                "top confidence {top} out of expected range [0.30, 0.95)"
            );
        }
    }

    #[test]
    fn all_confidence_values_in_unit_range() {
        let syndromes = get_syndromes();
        let diagnoses = generate_random_diagnoses(&syndromes);
        for entry in &diagnoses {
            assert!(
                entry.confidence > 0.0 && entry.confidence < 1.0,
                "confidence {} outside (0.0, 1.0)",
                entry.confidence
            );
        }
    }

    #[test]
    fn syndrome_names_are_non_empty() {
        let syndromes = get_syndromes();
        let diagnoses = generate_random_diagnoses(&syndromes);
        for entry in &diagnoses {
            assert!(!entry.syndrome_name.is_empty());
        }
    }

    #[test]
    fn results_are_randomised_across_calls() {
        let syndromes = get_syndromes();
        let first = generate_random_diagnoses(&syndromes);
        let second = generate_random_diagnoses(&syndromes);
        // With 50 syndromes the probability of identical rank-1 matches over
        // many calls is negligible.  We just assert they're not always the same.
        let first_names: Vec<&str> = first.iter().map(|d| d.syndrome_name.as_str()).collect();
        let second_names: Vec<&str> = second.iter().map(|d| d.syndrome_name.as_str()).collect();
        // Run many times until we see at least one difference to avoid flakiness.
        let mut seen_difference = first_names != second_names;
        for _ in 0..20 {
            if seen_difference {
                break;
            }
            let third = generate_random_diagnoses(&syndromes);
            let third_names: Vec<&str> = third.iter().map(|d| d.syndrome_name.as_str()).collect();
            seen_difference = third_names != first_names;
        }
        assert!(seen_difference, "generate_random_diagnoses always returns the same order");
    }
}
