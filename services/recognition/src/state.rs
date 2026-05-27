//! Shared application state injected into Axum route handlers.

use crate::syndromes::SyndromeInfo;

/// Shared state available to every HTTP handler via Axum's [`State`] extractor.
///
/// The struct is cheaply cloneable because the syndrome list is wrapped in an
/// [`Arc`] implicitly by Axum — Axum requires the state to be `Clone`, and
/// the [`Vec`] of `SyndromeInfo` values (each holding only a `Uuid` and a
/// `&'static str`) is small enough that a direct clone is acceptable here.
#[derive(Clone)]
pub struct AppState {
    /// Static syndrome catalogue used by the diagnosis generator.
    pub syndromes: Vec<SyndromeInfo>,
}
