<div align="center">

# DuplexSLA

**A Full-Duplex Spoken Language Model with Synchronized Speech, Language, and Action**

<a href="#"><img alt="arXiv" src="https://img.shields.io/badge/arXiv-coming%20soon-b31b1b.svg"></a>
<a href="https://huggingface.co/0xYoung4ever/DuplexSLA"><img alt="Hugging Face" src="https://img.shields.io/badge/%F0%9F%A4%97%20Hugging%20Face-models-blue.svg"></a>
<a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/License-MIT-yellow.svg"></a>

</div>

## 🔥 News

- **2026/05**: 📑 Released the **DuplexSLA** technical report.
- Inference code, model checkpoints, and **DuplexSLA-Bench** are coming soon — stay tuned.

## 📑 Open-source Plan

- [ ] DuplexSLA technical report (arXiv)
- [ ] Model checkpoints (Hugging Face)
- [ ] Inference code
- [ ] **DuplexSLA-Bench** evaluation code and data
- [ ] Online demo

## Introduction

**DuplexSLA** is a native full-duplex *Speech–Language–Action* foundation model. It unifies listening, speaking, in-conversation planning, and tool calling on a single conversational clock, decoding assistant audio together with a structured action stream on a shared 160 ms chunk timeline.

Recent spoken dialogue models have shifted from turn-based to full-duplex designs, where the model continuously listens to the user while generating responses. However, existing duplex backbones still lack a native channel for in-conversation planning and tool calling, leaving real-time agentic behaviour either tied to turn boundaries or relegated to an external cascade. DuplexSLA closes that gap with a **dual-stream three-channel formulation**:

- **User audio channel** — continuous user audio features at an 80 ms stride.
- **Assistant audio channel** — discrete assistant speech tokens in a *TA4* layout (1 text anchor + 4 audio tokens at a 40 ms stride per chunk).
- **Action channel** — a rate-limited textual stream carrying delayed transcripts, planning text, interaction-control labels, and structured tool calls (≤10 tokens per chunk).

All three channels are decoded jointly by a single backbone, so semantic-driven turn-taking and tool calling happen on the same chunked timeline.

<div align="center">
  <img src="assets/architecture.png" alt="DuplexSLA chunk-level architecture" width="92%">
  <br>
  <em>DuplexSLA chunk-level architecture. Each 160 ms chunk contributes 2 user audio features (80 ms each), one assistant TA4 unit (1 text anchor + 4 audio tokens), and up to 10 action-channel tokens for delayed transcripts, planning text, or tool calls.</em>
</div>

## Highlights

1. **Semantic-driven turn-taking control.** DuplexSLA emits `pause`, `interrupt`, and `backchannel` decisions internally based on its own semantic state, rather than relying on an external semantic VAD. This removes the latency bound of the detector and folds turn-taking into the model's token-level dynamics.

2. **In-conversation planning and tool calling.** Planning text and structured tool calls are emitted on the action channel without halting assistant audio, so multi-action and backchannel-triggered tool use are interleaved with ongoing speech. Tool calls are anchored to their own chunks on the action channel and can run in semantic order along the user's request.

3. **DuplexSLA-Bench.** A duplex benchmark covering `pause`, `interrupt`, and `backchannel` turn-taking together with three styles of in-conversation tool calling (single-action, multi-action, and backchannel-triggered tool calls), so duplex and agentic capabilities are evaluated jointly.

## Model Usage

> 🚧 Inference code, deployment recipes, and model checkpoints are not yet released. This section will be updated once the artefacts land on Hugging Face.

Planned release artefacts:

- Pretrained DuplexSLA checkpoint on Hugging Face.
- Reference inference / streaming server.
- DuplexSLA-Bench evaluation harness and data.

## Citation

If DuplexSLA is useful in your research, please consider giving the repository a ⭐ and citing:

```bibtex
@article{zhang2026duplexsla,
  title   = {{DuplexSLA}: A Full-Duplex Spoken Language Model with Synchronized Speech, Language, and Action},
  author  = {Zhang, Haoyang and Chen, Jun and Wu, Donghang and Li, Yuxin and Zhang, Yuxin and Zhang, Xiangyu Tony and Liu, Che and Lin, Qingjian and Peng, Yizhou and Liu, Hexin and Chng, Eng Siong and Yan, Chao and Wu, Boyong and Huang, Yechang and Yang, Xuerui and Yu, Gang and Tian, Fei},
  journal = {arXiv preprint},
  year    = {2026}
}
```

## License

This project is released under the [MIT License](LICENSE).
