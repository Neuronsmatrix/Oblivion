//! Static catalogue of well-known genetic syndromes used by the recognition
//! stub to generate deterministic but randomly-ordered differential diagnoses.
//!
//! Every [`SyndromeInfo`] carries a fixed [`Uuid`] derived from its 1-based
//! ordinal position, which guarantees that the same syndrome always carries the
//! same identifier across service restarts and deployments.
//!
//! # Example
//!
//! ```rust,ignore
//! use oblivion_recognition::syndromes::get_syndromes;
//!
//! let syndromes = get_syndromes();
//! assert_eq!(syndromes.len(), 50);
//! assert_eq!(syndromes[0].name, "Down Syndrome");
//! ```

use uuid::Uuid;

/// A single entry in the static syndrome catalogue.
#[derive(Debug, Clone)]
pub struct SyndromeInfo {
    /// Deterministic UUID for this syndrome (`Uuid::from_u128(ordinal)`).
    pub id: Uuid,
    /// Human-readable syndrome name.
    pub name: &'static str,
}

/// Return the full list of 50 genetic syndromes used by the recognition stub.
///
/// UUIDs are derived from the 1-based index of each entry so they are stable
/// across compilations and service restarts.
#[must_use]
pub fn get_syndromes() -> Vec<SyndromeInfo> {
    vec![
        SyndromeInfo { id: Uuid::from_u128(1),  name: "Down Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(2),  name: "Turner Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(3),  name: "Noonan Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(4),  name: "Williams Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(5),  name: "Angelman Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(6),  name: "Prader-Willi Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(7),  name: "Cornelia de Lange Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(8),  name: "Kabuki Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(9),  name: "Rubinstein-Taybi Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(10), name: "Treacher Collins Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(11), name: "Marfan Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(12), name: "Ehlers-Danlos Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(13), name: "Fragile X Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(14), name: "Rett Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(15), name: "Apert Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(16), name: "Crouzon Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(17), name: "DiGeorge Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(18), name: "Wolf-Hirschhorn Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(19), name: "Cri du Chat Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(20), name: "Patau Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(21), name: "Edwards Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(22), name: "Klinefelter Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(23), name: "Sotos Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(24), name: "Beckwith-Wiedemann Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(25), name: "Russell-Silver Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(26), name: "Stickler Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(27), name: "Waardenburg Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(28), name: "Coffin-Siris Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(29), name: "Floating-Harbor Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(30), name: "KBG Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(31), name: "Mowat-Wilson Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(32), name: "Phelan-McDermid Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(33), name: "Costello Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(34), name: "Cardiofaciocutaneous Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(35), name: "CHARGE Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(36), name: "Jacobsen Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(37), name: "Smith-Magenis Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(38), name: "Potocki-Lupski Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(39), name: "Kleefstra Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(40), name: "Koolen-de Vries Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(41), name: "Schinzel-Giedion Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(42), name: "Marshall-Smith Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(43), name: "Weaver Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(44), name: "Pallister-Killian Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(45), name: "Bohring-Opitz Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(46), name: "Wiedemann-Steiner Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(47), name: "Nicolaides-Baraitser Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(48), name: "Genitopatellar Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(49), name: "DOORS Syndrome" },
        SyndromeInfo { id: Uuid::from_u128(50), name: "Bainbridge-Ropers Syndrome" },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn catalogue_has_exactly_fifty_entries() {
        assert_eq!(get_syndromes().len(), 50);
    }

    #[test]
    fn first_entry_is_down_syndrome() {
        let syndromes = get_syndromes();
        assert_eq!(syndromes[0].name, "Down Syndrome");
        assert_eq!(syndromes[0].id, Uuid::from_u128(1));
    }

    #[test]
    fn all_ids_are_unique() {
        let syndromes = get_syndromes();
        let mut ids: Vec<Uuid> = syndromes.iter().map(|s| s.id).collect();
        ids.sort();
        ids.dedup();
        assert_eq!(ids.len(), 50, "duplicate UUIDs detected in syndrome catalogue");
    }

    #[test]
    fn all_names_are_non_empty() {
        for syndrome in get_syndromes() {
            assert!(!syndrome.name.is_empty(), "empty name for UUID {}", syndrome.id);
        }
    }

    #[test]
    fn ids_are_one_based_sequential() {
        let syndromes = get_syndromes();
        for (index, syndrome) in syndromes.iter().enumerate() {
            let expected = Uuid::from_u128(index as u128 + 1);
            assert_eq!(
                syndrome.id, expected,
                "syndrome at index {} has unexpected UUID",
                index
            );
        }
    }
}
