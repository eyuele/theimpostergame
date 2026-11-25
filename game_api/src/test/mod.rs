/// to be moved to a testing file (test.rs)

#[cfg(test)]
pub mod rank_tests {
    use crate::api::game_utils::*;

    #[test]
    fn zero_is_recruit() {
        let r = rank_for_score(0);
        assert_eq!(r.rank, "Recruit");
        assert_eq!(r.next_rank.unwrap().points_remaining, 300);
    }

    #[test]
    fn just_below_threshold_is_lower_rank() {
        assert_eq!(rank_for_score(299).rank, "Recruit");
        assert_eq!(rank_for_score(799).rank, "Rookie");
    }

    #[test]
    fn exactly_at_threshold_is_higher_rank() {
        assert_eq!(rank_for_score(300).rank, "Rookie");
        assert_eq!(rank_for_score(800).rank, "Sleuth");
        assert_eq!(rank_for_score(1_800).rank, "Detective");
    }

    #[test]
    fn legend_has_no_next_rank() {
        let r = rank_for_score(12_000);
        assert_eq!(r.rank, "Legend");
        assert!(r.next_rank.is_none());
        assert!(rank_for_score(999_999).next_rank.is_none());
    }
}
