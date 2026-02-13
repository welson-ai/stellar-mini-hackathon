#![no_std]
use soroban_sdk::{contract, contractimpl, log, symbol_short, Env, Symbol};

const COUNTER: Symbol = symbol_short!("COUNTER");

#[contract]
pub struct CounterContract;

#[contractimpl]
impl CounterContract {
    pub fn increment(env: Env) -> u32 {
        let mut count: u32 = env.storage().persistent().get(&COUNTER).unwrap_or(0);
        count += 1;
        env.storage().persistent().set(&COUNTER, &count);
        log!(&env, "Count incremented to {}", count);
        count
    }

    pub fn get_count(env: Env) -> u32 {
        env.storage().persistent().get(&COUNTER).unwrap_or(0)
    }
}
